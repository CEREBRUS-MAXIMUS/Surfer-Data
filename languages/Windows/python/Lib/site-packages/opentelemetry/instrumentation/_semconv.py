# Copyright The OpenTelemetry Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import threading
from enum import Enum

from opentelemetry.semconv.trace import SpanAttributes

# TODO: will come through semconv package once updated
_SPAN_ATTRIBUTES_ERROR_TYPE = "error.type"
_SPAN_ATTRIBUTES_NETWORK_PEER_ADDRESS = "network.peer.address"
_SPAN_ATTRIBUTES_NETWORK_PEER_PORT = "network.peer.port"
_METRIC_ATTRIBUTES_CLIENT_DURATION_NAME = "http.client.request.duration"

_client_duration_attrs_old = [
    SpanAttributes.HTTP_STATUS_CODE,
    SpanAttributes.HTTP_HOST,
    SpanAttributes.NET_PEER_PORT,
    SpanAttributes.NET_PEER_NAME,
    SpanAttributes.HTTP_METHOD,
    SpanAttributes.HTTP_FLAVOR,
    SpanAttributes.HTTP_SCHEME,
]

_client_duration_attrs_new = [
    _SPAN_ATTRIBUTES_ERROR_TYPE,
    SpanAttributes.HTTP_REQUEST_METHOD,
    SpanAttributes.HTTP_RESPONSE_STATUS_CODE,
    SpanAttributes.NETWORK_PROTOCOL_VERSION,
    SpanAttributes.SERVER_ADDRESS,
    SpanAttributes.SERVER_PORT,
    # TODO: Support opt-in for scheme in new semconv
    # SpanAttributes.URL_SCHEME,
]


def _filter_duration_attrs(attrs, sem_conv_opt_in_mode):
    filtered_attrs = {}
    allowed_attributes = (
        _client_duration_attrs_new
        if sem_conv_opt_in_mode == _OpenTelemetryStabilityMode.HTTP
        else _client_duration_attrs_old
    )
    for key, val in attrs.items():
        if key in allowed_attributes:
            filtered_attrs[key] = val
    return filtered_attrs


def set_string_attribute(result, key, value):
    if value:
        result[key] = value


def set_int_attribute(result, key, value):
    if value:
        try:
            result[key] = int(value)
        except ValueError:
            return


def _set_http_method(result, original, normalized, sem_conv_opt_in_mode):
    original = original.strip()
    normalized = normalized.strip()
    # See https://github.com/open-telemetry/semantic-conventions/blob/main/docs/http/http-spans.md#common-attributes
    # Method is case sensitive. "http.request.method_original" should not be sanitized or automatically capitalized.
    if original != normalized and _report_new(sem_conv_opt_in_mode):
        set_string_attribute(
            result, SpanAttributes.HTTP_REQUEST_METHOD_ORIGINAL, original
        )

    if _report_old(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.HTTP_METHOD, normalized)
    if _report_new(sem_conv_opt_in_mode):
        set_string_attribute(
            result, SpanAttributes.HTTP_REQUEST_METHOD, normalized
        )


def _set_http_url(result, url, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.HTTP_URL, url)
    if _report_new(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.URL_FULL, url)


def _set_http_scheme(result, scheme, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.HTTP_SCHEME, scheme)
    # TODO: Support opt-in for scheme in new semconv
    # if _report_new(sem_conv_opt_in_mode):
    #     set_string_attribute(result, SpanAttributes.URL_SCHEME, scheme)


def _set_http_hostname(result, hostname, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.HTTP_HOST, hostname)
    if _report_new(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.SERVER_ADDRESS, hostname)


def _set_http_net_peer_name(result, peer_name, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.NET_PEER_NAME, peer_name)
    if _report_new(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.SERVER_ADDRESS, peer_name)


def _set_http_port(result, port, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_int_attribute(result, SpanAttributes.NET_PEER_PORT, port)
    if _report_new(sem_conv_opt_in_mode):
        set_int_attribute(result, SpanAttributes.SERVER_PORT, port)


def _set_http_status_code(result, code, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_int_attribute(result, SpanAttributes.HTTP_STATUS_CODE, code)
    if _report_new(sem_conv_opt_in_mode):
        set_int_attribute(
            result, SpanAttributes.HTTP_RESPONSE_STATUS_CODE, code
        )


def _set_http_network_protocol_version(result, version, sem_conv_opt_in_mode):
    if _report_old(sem_conv_opt_in_mode):
        set_string_attribute(result, SpanAttributes.HTTP_FLAVOR, version)
    if _report_new(sem_conv_opt_in_mode):
        set_string_attribute(
            result, SpanAttributes.NETWORK_PROTOCOL_VERSION, version
        )


_OTEL_SEMCONV_STABILITY_OPT_IN_KEY = "OTEL_SEMCONV_STABILITY_OPT_IN"


class _OpenTelemetryStabilitySignalType:
    HTTP = "http"


class _OpenTelemetryStabilityMode(Enum):
    # http - emit the new, stable HTTP and networking conventions ONLY
    HTTP = "http"
    # http/dup - emit both the old and the stable HTTP and networking conventions
    HTTP_DUP = "http/dup"
    # default - continue emitting old experimental HTTP and networking conventions
    DEFAULT = "default"


def _report_new(mode):
    return mode.name != _OpenTelemetryStabilityMode.DEFAULT.name


def _report_old(mode):
    return mode.name != _OpenTelemetryStabilityMode.HTTP.name


class _OpenTelemetrySemanticConventionStability:
    _initialized = False
    _lock = threading.Lock()
    _OTEL_SEMCONV_STABILITY_SIGNAL_MAPPING = {}

    @classmethod
    def _initialize(cls):
        with _OpenTelemetrySemanticConventionStability._lock:
            if not _OpenTelemetrySemanticConventionStability._initialized:
                # Users can pass in comma delimited string for opt-in options
                # Only values for http stability are supported for now
                opt_in = os.environ.get(_OTEL_SEMCONV_STABILITY_OPT_IN_KEY, "")
                opt_in_list = []
                if opt_in:
                    opt_in_list = [s.strip() for s in opt_in.split(",")]
                http_opt_in = _OpenTelemetryStabilityMode.DEFAULT
                if opt_in_list:
                    # Process http opt-in
                    # http/dup takes priority over http
                    if (
                        _OpenTelemetryStabilityMode.HTTP_DUP.value
                        in opt_in_list
                    ):
                        http_opt_in = _OpenTelemetryStabilityMode.HTTP_DUP
                    elif _OpenTelemetryStabilityMode.HTTP.value in opt_in_list:
                        http_opt_in = _OpenTelemetryStabilityMode.HTTP
                _OpenTelemetrySemanticConventionStability._OTEL_SEMCONV_STABILITY_SIGNAL_MAPPING[
                    _OpenTelemetryStabilitySignalType.HTTP
                ] = http_opt_in
                _OpenTelemetrySemanticConventionStability._initialized = True

    @classmethod
    # Get OpenTelemetry opt-in mode based off of signal type (http, messaging, etc.)
    def _get_opentelemetry_stability_opt_in_mode(
        cls,
        signal_type: _OpenTelemetryStabilitySignalType,
    ) -> _OpenTelemetryStabilityMode:
        return _OpenTelemetrySemanticConventionStability._OTEL_SEMCONV_STABILITY_SIGNAL_MAPPING.get(
            signal_type, _OpenTelemetryStabilityMode.DEFAULT
        )


# Get schema version based off of opt-in mode
def _get_schema_url(mode: _OpenTelemetryStabilityMode) -> str:
    if mode is _OpenTelemetryStabilityMode.DEFAULT:
        return "https://opentelemetry.io/schemas/1.11.0"
    return SpanAttributes.SCHEMA_URL
