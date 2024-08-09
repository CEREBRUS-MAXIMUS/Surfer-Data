#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

"""
The Pulsar Python client library is based on the existing C++ client library.
All the same features are exposed through the Python interface.

Currently, the supported Python versions are 3.7, 3.8, 3.9 and 3.10.

=================
Install from PyPI
=================

Download Python wheel binary files for macOS and Linux directly from
the PyPI archive:

.. code-block:: shell

    sudo pip install pulsar-client

========================
Install from source code
========================

Read the instructions on `source code repository
<https://github.com/apache/pulsar-client-python#install-the-python-wheel>`_.
"""

import logging
from typing import List, Tuple, Optional

import _pulsar

from _pulsar import Result, CompressionType, ConsumerType, InitialPosition, PartitionsRoutingMode, BatchingType, \
    LoggerLevel, BatchReceivePolicy, KeySharedPolicy, KeySharedMode, ProducerAccessMode, RegexSubscriptionMode, \
    DeadLetterPolicyBuilder  # noqa: F401

from pulsar.__about__ import __version__

from pulsar.exceptions import *

from pulsar.functions.function import Function
from pulsar.functions.context import Context
from pulsar.functions.serde import SerDe, IdentitySerDe, PickleSerDe
from pulsar import schema
_schema = schema

import re
_retype = type(re.compile('x'))

from datetime import timedelta


class MessageId:
    """
    Represents a message id.

    Attributes
    ----------

    earliest:
        Represents the earliest message stored in a topic
    latest:
        Represents the latest message published on a topic
    """

    def __init__(self, partition=-1, ledger_id=-1, entry_id=-1, batch_index=-1):
        self._msg_id = _pulsar.MessageId(partition, ledger_id, entry_id, batch_index)

    earliest = _pulsar.MessageId.earliest
    latest = _pulsar.MessageId.latest

    def ledger_id(self):
        return self._msg_id.ledger_id()

    def entry_id(self):
        return self._msg_id.entry_id()

    def batch_index(self):
        return self._msg_id.batch_index()

    def partition(self):
        return self._msg_id.partition()

    def serialize(self):
        """
        Returns a bytes representation of the message id.
        This byte sequence can be stored and later deserialized.
        """
        return self._msg_id.serialize()

    @staticmethod
    def deserialize(message_id_bytes):
        """
        Deserialize a message id object from a previously
        serialized bytes sequence.
        """
        return _pulsar.MessageId.deserialize(message_id_bytes)


class Message:
    """
    Message objects are returned by a consumer, either by calling `receive` or
    through a listener.
    """

    def data(self):
        """
        Returns object typed bytes with the payload of the message.
        """
        return self._message.data()

    def value(self):
        """
        Returns object with the de-serialized version of the message content
        """
        return self._schema.decode_message(self._message)

    def properties(self):
        """
        Return the properties attached to the message. Properties are
        application-defined key/value pairs that will be attached to the
        message.
        """
        return self._message.properties()

    def partition_key(self):
        """
        Get the partitioning key for the message.
        """
        return self._message.partition_key()

    def ordering_key(self):
        """
        Get the ordering key for the message.
        """
        return self._message.ordering_key()

    def publish_timestamp(self):
        """
        Get the timestamp in milliseconds with the message publish time.
        """
        return self._message.publish_timestamp()

    def event_timestamp(self):
        """
        Get the timestamp in milliseconds with the message event time.
        """
        return self._message.event_timestamp()

    def message_id(self):
        """
        The message ID that can be used to refer to this particular message.
        """
        return self._message.message_id()

    def topic_name(self):
        """
        Get the topic Name from which this message originated from
        """
        return self._message.topic_name()

    def redelivery_count(self):
        """
        Get the redelivery count for this message
        """
        return self._message.redelivery_count()

    def schema_version(self):
        """
        Get the schema version for this message
        """
        return self._message.schema_version()

    @staticmethod
    def _wrap(_message):
        self = Message()
        self._message = _message
        return self


class MessageBatch:

    def __init__(self):
        self._msg_batch = _pulsar.MessageBatch()

    def with_message_id(self, msg_id):
        if not isinstance(msg_id, _pulsar.MessageId):
            if isinstance(msg_id, MessageId):
                msg_id = msg_id._msg_id
            else:
                raise TypeError("unknown message id type")
        self._msg_batch.with_message_id(msg_id)
        return self

    def parse_from(self, data, size):
        self._msg_batch.parse_from(data, size)
        _msgs = self._msg_batch.messages()
        return list(map(Message._wrap, _msgs))


class Authentication:
    """
    Authentication provider object. Used to load authentication from an external
    shared library.
    """
    def __init__(self, dynamicLibPath, authParamsString):
        """
        Create the authentication provider instance.

        Parameters
        ----------

        dynamicLibPath: str
            Path to the authentication provider shared library (such as ``tls.so``)
        authParamsString: str
            Comma-separated list of provider-specific configuration params
        """
        _check_type(str, dynamicLibPath, 'dynamicLibPath')
        _check_type(str, authParamsString, 'authParamsString')
        self.auth = _pulsar.Authentication.create(dynamicLibPath, authParamsString)


class AuthenticationTLS(Authentication):
    """
    TLS Authentication implementation
    """
    def __init__(self, certificate_path, private_key_path):
        """
        Create the TLS authentication provider instance.

        Parameters
        ----------

        certificate_path: str
            Path to the public certificate
        private_key_path: str
            Path to private TLS key
        """
        _check_type(str, certificate_path, 'certificate_path')
        _check_type(str, private_key_path, 'private_key_path')
        self.auth = _pulsar.AuthenticationTLS.create(certificate_path, private_key_path)


class AuthenticationToken(Authentication):
    """
    Token based authentication implementation
    """
    def __init__(self, token):
        """
        Create the token authentication provider instance.

        Parameters
        ----------

        token
            A string containing the token or a functions that provides a string with the token
        """
        if not (isinstance(token, str) or callable(token)):
            raise ValueError("Argument token is expected to be of type 'str' or a function returning 'str'")
        self.auth = _pulsar.AuthenticationToken.create(token)


class AuthenticationAthenz(Authentication):
    """
    Athenz Authentication implementation
    """
    def __init__(self, auth_params_string):
        """
        Create the Athenz authentication provider instance.

        Parameters
        ----------

        auth_params_string: str
            JSON encoded configuration for Athenz client
        """
        _check_type(str, auth_params_string, 'auth_params_string')
        self.auth = _pulsar.AuthenticationAthenz.create(auth_params_string)

class AuthenticationOauth2(Authentication):
    """
    Oauth2 Authentication implementation
    """
    def __init__(self, auth_params_string: str):
        """
        Create the Oauth2 authentication provider instance.

        You can create the instance by setting the necessary fields in the JSON string.

        .. code-block:: python

            auth = AuthenticationOauth2('{"issuer_url": "xxx", "private_key": "yyy"}')

        The valid JSON fields are:

        * issuer_url (required)
            The URL of the authentication provider which allows the Pulsar client to obtain an
            access token.
        * private_key (required)
            The URL to the JSON credentials file. It supports the following pattern formats:

            * ``/path/to/file``
            * ``file:///path/to/file``
            * ``file:/path/to/file``
            * ``data:application/json;base64,<base64-encoded-value>``

            The file content or the based64 encoded value is the encoded JSON string that contains
            the following fields:

            * ``client_id``
            * ``client_secret``
        * audience
            The OAuth 2.0 "resource server" identifier for a Pulsar cluster.
        * scope
            The scope of an access request.

        Parameters
        ----------
        auth_params_string : str
            JSON encoded configuration for Oauth2 client

        """
        _check_type(str, auth_params_string, 'auth_params_string')
        self.auth = _pulsar.AuthenticationOauth2.create(auth_params_string)

class AuthenticationBasic(Authentication):
    """
    Basic Authentication implementation
    """
    def __init__(self, username=None, password=None, method='basic', auth_params_string=None):
        """
        Create the Basic authentication provider instance.

        For example, if you want to create a basic authentication instance whose
        username is "my-user" and password is "my-pass", there are two ways:

        .. code-block:: python

            auth = AuthenticationBasic('my-user', 'my-pass')
            auth = AuthenticationBasic(auth_params_string='{"username": "my-user", "password": "my-pass"}')


        Parameters
        ----------
        username : str, optional
        password : str, optional
        method : str, default='basic'
            The authentication method name
        auth_params_string : str, optional
            The JSON presentation of all fields above. If it's not None, the other parameters will be ignored.
            Here is an example JSON presentation:

                {"username": "my-user", "password": "my-pass", "method": "oms3.0"}

            The ``username`` and ``password`` fields are required. If the "method" field is not set, it will be
            "basic" by default.
        """
        if auth_params_string is not None:
            _check_type(str, auth_params_string, 'auth_params_string')
            self.auth = _pulsar.AuthenticationBasic.create(auth_params_string)
        else:
            _check_type(str, username, 'username')
            _check_type(str, password, 'password')
            _check_type(str, method, 'method')
            self.auth = _pulsar.AuthenticationBasic.create(username, password, method)

class ConsumerDeadLetterPolicy:
    """
    Configuration for the "dead letter queue" feature in consumer.
    """
    def __init__(self,
                 max_redeliver_count: int,
                 dead_letter_topic: str = None,
                 initial_subscription_name: str = None):
        """
        Wrapper DeadLetterPolicy.

        Parameters
        ----------
        max_redeliver_count: Maximum number of times that a message is redelivered before being sent to the dead letter queue.
            - The maxRedeliverCount must be greater than 0.
        dead_letter_topic: Name of the dead topic where the failing messages are sent.
            The default value is: sourceTopicName + "-" + subscriptionName + "-DLQ"
        initial_subscription_name: Name of the initial subscription name of the dead letter topic.
            If this field is not set, the initial subscription for the dead letter topic is not created.
            If this field is set but the broker's `allowAutoSubscriptionCreation` is disabled, the DLQ producer
            fails to be created.
        """
        builder = DeadLetterPolicyBuilder()
        if max_redeliver_count is None or max_redeliver_count < 1:
            raise ValueError("max_redeliver_count must be greater than 0")
        builder.maxRedeliverCount(max_redeliver_count)
        if dead_letter_topic is not None:
            builder.deadLetterTopic(dead_letter_topic)
        if initial_subscription_name is not None:
            builder.initialSubscriptionName(initial_subscription_name)
        self._policy = builder.build()

    @property
    def dead_letter_topic(self) -> str:
        """
        Return the dead letter topic for dead letter policy.
        """
        return self._policy.getDeadLetterTopic()

    @property
    def max_redeliver_count(self) -> int:
        """
        Return the max redeliver count for dead letter policy.
        """
        return self._policy.getMaxRedeliverCount()

    @property
    def initial_subscription_name(self) -> str:
        """
        Return the initial subscription name for dead letter policy.
        """
        return self._policy.getInitialSubscriptionName()

    def policy(self):
        """
        Returns the actual one DeadLetterPolicy.
        """
        return self._policy

class CryptoKeyReader:
    """
    Default crypto key reader implementation
    """
    def __init__(self, public_key_path, private_key_path):
        """
        Create crypto key reader.

        Parameters
        ----------

        public_key_path: str
            Path to the public key
        private_key_path: str
            Path to private key
        """
        _check_type(str, public_key_path, 'public_key_path')
        _check_type(str, private_key_path, 'private_key_path')
        self.cryptoKeyReader = _pulsar.CryptoKeyReader(public_key_path, private_key_path)

class Client:
    """
    The Pulsar client. A single client instance can be used to create producers
    and consumers on multiple topics.

    The client will share the same connection pool and threads across all
    producers and consumers.
    """

    def __init__(self, service_url,
                 authentication=None,
                 operation_timeout_seconds=30,
                 io_threads=1,
                 message_listener_threads=1,
                 concurrent_lookup_requests=50000,
                 log_conf_file_path=None,
                 use_tls=False,
                 tls_trust_certs_file_path=None,
                 tls_allow_insecure_connection=False,
                 tls_validate_hostname=False,
                 logger=None,
                 connection_timeout_ms=10000,
                 listener_name=None
                 ):
        """
        Create a new Pulsar client instance.

        Parameters
        ----------

        service_url: str
            The Pulsar service url eg: pulsar://my-broker.com:6650/
        authentication: Authentication, optional
            Set the authentication provider to be used with the broker. Supported methods:

            * `AuthenticationTLS`
            * `AuthenticationToken`
            * `AuthenticationAthenz`
            * `AuthenticationOauth2`
        operation_timeout_seconds: int, default=30
            Set timeout on client operations (subscribe, create producer, close, unsubscribe).
        io_threads: int, default=1
            Set the number of IO threads to be used by the Pulsar client.
        message_listener_threads: int, default=1
            Set the number of threads to be used by the Pulsar client when delivering messages through
            message listener. The default is 1 thread per Pulsar client. If using more than 1 thread,
            messages for distinct ``message_listener``s will be delivered in different threads, however a
            single ``MessageListener`` will always be assigned to the same thread.
        concurrent_lookup_requests: int, default=50000
            Number of concurrent lookup-requests allowed on each broker connection to prevent overload
            on the broker.
        log_conf_file_path: str, optional
            This parameter is deprecated and makes no effect. It's retained only for compatibility.
            Use `logger` to customize a logger.
        use_tls: bool, default=False
            Configure whether to use TLS encryption on the connection. This setting is deprecated.
            TLS will be automatically enabled if the ``serviceUrl`` is set to ``pulsar+ssl://`` or ``https://``
        tls_trust_certs_file_path: str, optional
            Set the path to the trusted TLS certificate file. If empty defaults to certifi.
        tls_allow_insecure_connection: bool, default=False
            Configure whether the Pulsar client accepts untrusted TLS certificates from the broker.
        tls_validate_hostname: bool, default=False
            Configure whether the Pulsar client validates that the hostname of the endpoint,
            matches the common name on the TLS certificate presented by the endpoint.
        logger: optional
            Set a Python logger for this Pulsar client. Should be an instance of `logging.Logger`.
        connection_timeout_ms: int, default=10000
            Set timeout in milliseconds on TCP connections.
        listener_name: str, optional
            Listener name for lookup. Clients can use listenerName to choose one of the listeners as
            the service URL to create a connection to the broker as long as the network is accessible.
            ``advertisedListeners`` must be enabled in broker side.
        """
        _check_type(str, service_url, 'service_url')
        _check_type_or_none(Authentication, authentication, 'authentication')
        _check_type(int, operation_timeout_seconds, 'operation_timeout_seconds')
        _check_type(int, connection_timeout_ms, 'connection_timeout_ms')
        _check_type(int, io_threads, 'io_threads')
        _check_type(int, message_listener_threads, 'message_listener_threads')
        _check_type(int, concurrent_lookup_requests, 'concurrent_lookup_requests')
        _check_type_or_none(str, log_conf_file_path, 'log_conf_file_path')
        _check_type(bool, use_tls, 'use_tls')
        _check_type_or_none(str, tls_trust_certs_file_path, 'tls_trust_certs_file_path')
        _check_type(bool, tls_allow_insecure_connection, 'tls_allow_insecure_connection')
        _check_type(bool, tls_validate_hostname, 'tls_validate_hostname')
        _check_type_or_none(str, listener_name, 'listener_name')

        conf = _pulsar.ClientConfiguration()
        if authentication:
            conf.authentication(authentication.auth)
        conf.operation_timeout_seconds(operation_timeout_seconds)
        conf.connection_timeout(connection_timeout_ms)
        conf.io_threads(io_threads)
        conf.message_listener_threads(message_listener_threads)
        conf.concurrent_lookup_requests(concurrent_lookup_requests)

        if isinstance(logger, logging.Logger):
            conf.set_logger(self._prepare_logger(logger))
        elif isinstance(logger, ConsoleLogger):
            conf.set_console_logger(logger.log_level)
        elif isinstance(logger, FileLogger):
            conf.set_file_logger(logger.log_level, logger.log_file)
        elif logger is not None:
            raise ValueError("Logger is expected to be either None, logger.Logger, pulsar.ConsoleLogger or pulsar.FileLogger")

        if listener_name:
            conf.listener_name(listener_name)
        if use_tls or service_url.startswith('pulsar+ssl://') or service_url.startswith('https://'):
            conf.use_tls(True)
        if tls_trust_certs_file_path:
            conf.tls_trust_certs_file_path(tls_trust_certs_file_path)
        else:
            import certifi
            conf.tls_trust_certs_file_path(certifi.where())
        conf.tls_allow_insecure_connection(tls_allow_insecure_connection)
        conf.tls_validate_hostname(tls_validate_hostname)
        self._client = _pulsar.Client(service_url, conf)
        self._consumers = []

    @staticmethod
    def _prepare_logger(logger):
        import logging
        def log(level, message):
            old_threads = logging.logThreads
            logging.logThreads = False
            logger.log(logging.getLevelName(level), message)
            logging.logThreads = old_threads
        return log

    def create_producer(self, topic,
                        producer_name=None,
                        schema=schema.BytesSchema(),
                        initial_sequence_id=None,
                        send_timeout_millis=30000,
                        compression_type: CompressionType = CompressionType.NONE,
                        max_pending_messages=1000,
                        max_pending_messages_across_partitions=50000,
                        block_if_queue_full=False,
                        batching_enabled=False,
                        batching_max_messages=1000,
                        batching_max_allowed_size_in_bytes=128*1024,
                        batching_max_publish_delay_ms=10,
                        chunking_enabled=False,
                        message_routing_mode: PartitionsRoutingMode = PartitionsRoutingMode.RoundRobinDistribution,
                        lazy_start_partitioned_producers=False,
                        properties=None,
                        batching_type: BatchingType = BatchingType.Default,
                        encryption_key=None,
                        crypto_key_reader: CryptoKeyReader = None,
                        access_mode: ProducerAccessMode = ProducerAccessMode.Shared,
                        ):
        """
        Create a new producer on a given topic.

        Parameters
        ----------

        topic: str
            The topic name
        producer_name: str, optional
            Specify a name for the producer. If not assigned, the system will generate a globally unique name
            which can be accessed with `Producer.producer_name()`. When specifying a name, it is app to the user
            to ensure that, for a given topic, the producer name is unique across all Pulsar's clusters.
        schema: pulsar.schema.Schema, default=pulsar.schema.BytesSchema
            Define the schema of the data that will be published by this producer, e.g,
            ``schema=JsonSchema(MyRecordClass)``.

            The schema will be used for two purposes:
                * Validate the data format against the topic defined schema
                * Perform serialization/deserialization between data and objects
        initial_sequence_id: int, optional
            Set the baseline for the sequence ids for messages published by the producer. First message will be
            using ``(initialSequenceId + 1)`` as its sequence id and subsequent messages will be assigned
            incremental sequence ids, if not otherwise specified.
        send_timeout_millis: int, default=30000
            If a message is not acknowledged by the server before the ``send_timeout`` expires, an error will be reported.
        compression_type: CompressionType, default=CompressionType.NONE
            Set the compression type for the producer. By default, message payloads are not compressed.

            Supported compression types:

            * CompressionType.LZ4
            * CompressionType.ZLib
            * CompressionType.ZSTD
            * CompressionType.SNAPPY

            ZSTD is supported since Pulsar 2.3. Consumers will need to be at least at that release in order to
            be able to receive messages compressed with ZSTD.

            SNAPPY is supported since Pulsar 2.4. Consumers will need to be at least at that release in order to
            be able to receive messages compressed with SNAPPY.
        max_pending_messages: int, default=1000
            Set the max size of the queue holding the messages pending to receive an acknowledgment from the broker.
        max_pending_messages_across_partitions: int, default=50000
            Set the max size of the queue holding the messages pending to receive an acknowledgment across partitions
            from the broker.
        block_if_queue_full: bool, default=False
            Set whether `send_async` operations should block when the outgoing message queue is full.
        message_routing_mode: PartitionsRoutingMode, default=PartitionsRoutingMode.RoundRobinDistribution
            Set the message routing mode for the partitioned producer.

            Supported modes:

            * ``PartitionsRoutingMode.RoundRobinDistribution``
            * ``PartitionsRoutingMode.UseSinglePartition``
        lazy_start_partitioned_producers: bool, default=False
            This config affects producers of partitioned topics only. It controls whether producers register
            and connect immediately to the owner broker of each partition or start lazily on demand. The internal
            producer of one partition is always started eagerly, chosen by the routing policy, but the internal
            producers of any additional partitions are started on demand, upon receiving their first message.

            Using this mode can reduce the strain on brokers for topics with large numbers of partitions and when
            the SinglePartition routing policy is used without keyed messages. Because producer connection can be
            on demand, this can produce extra send latency for the first messages of a given partition.
        properties: dict, optional
            Sets the properties for the producer. The properties associated with a producer can be used for identify
            a producer at broker side.
        batching_type: BatchingType, default=BatchingType.Default
            Sets the batching type for the producer.

            There are two batching type: DefaultBatching and KeyBasedBatching.

            DefaultBatching will batch single messages:
                (k1, v1), (k2, v1), (k3, v1), (k1, v2), (k2, v2), (k3, v2), (k1, v3), (k2, v3), (k3, v3)
            ... into single batch message:
                [(k1, v1), (k2, v1), (k3, v1), (k1, v2), (k2, v2), (k3, v2), (k1, v3), (k2, v3), (k3, v3)]

            KeyBasedBatching will batch incoming single messages:
                (k1, v1), (k2, v1), (k3, v1), (k1, v2), (k2, v2), (k3, v2), (k1, v3), (k2, v3), (k3, v3)
            ... into single batch message:
                [(k1, v1), (k1, v2), (k1, v3)], [(k2, v1), (k2, v2), (k2, v3)], [(k3, v1), (k3, v2), (k3, v3)]
        chunking_enabled: bool, default=False
            If message size is higher than allowed max publish-payload size by broker then chunking_enabled helps
            producer to split message into multiple chunks and publish them to broker separately and in order.
            So, it allows client to successfully publish large size of messages in pulsar.
        encryption_key: str, optional
            The key used for symmetric encryption, configured on the producer side
        crypto_key_reader: CryptoKeyReader, optional
            Symmetric encryption class implementation, configuring public key encryption messages for the producer
            and private key decryption messages for the consumer
        access_mode: ProducerAccessMode, optional
            Set the type of access mode that the producer requires on the topic.

            Supported modes:

            * Shared: By default multiple producers can publish on a topic.
            * Exclusive: Require exclusive access for producer.
                         Fail immediately if there's already a producer connected.
            * WaitForExclusive: Producer creation is pending until it can acquire exclusive access.
            * ExclusiveWithFencing: Acquire exclusive access for the producer.
                                    Any existing producer will be removed and invalidated immediately.
        """
        _check_type(str, topic, 'topic')
        _check_type_or_none(str, producer_name, 'producer_name')
        _check_type(_schema.Schema, schema, 'schema')
        _check_type_or_none(int, initial_sequence_id, 'initial_sequence_id')
        _check_type(int, send_timeout_millis, 'send_timeout_millis')
        _check_type(CompressionType, compression_type, 'compression_type')
        _check_type(int, max_pending_messages, 'max_pending_messages')
        _check_type(int, max_pending_messages_across_partitions, 'max_pending_messages_across_partitions')
        _check_type(bool, block_if_queue_full, 'block_if_queue_full')
        _check_type(bool, batching_enabled, 'batching_enabled')
        _check_type(int, batching_max_messages, 'batching_max_messages')
        _check_type(int, batching_max_allowed_size_in_bytes, 'batching_max_allowed_size_in_bytes')
        _check_type(int, batching_max_publish_delay_ms, 'batching_max_publish_delay_ms')
        _check_type(bool, chunking_enabled, 'chunking_enabled')
        _check_type_or_none(dict, properties, 'properties')
        _check_type(BatchingType, batching_type, 'batching_type')
        _check_type_or_none(str, encryption_key, 'encryption_key')
        _check_type_or_none(CryptoKeyReader, crypto_key_reader, 'crypto_key_reader')
        _check_type(bool, lazy_start_partitioned_producers, 'lazy_start_partitioned_producers')
        _check_type(ProducerAccessMode, access_mode, 'access_mode')

        conf = _pulsar.ProducerConfiguration()
        conf.send_timeout_millis(send_timeout_millis)
        conf.compression_type(compression_type)
        conf.max_pending_messages(max_pending_messages)
        conf.max_pending_messages_across_partitions(max_pending_messages_across_partitions)
        conf.block_if_queue_full(block_if_queue_full)
        conf.batching_enabled(batching_enabled)
        conf.batching_max_messages(batching_max_messages)
        conf.batching_max_allowed_size_in_bytes(batching_max_allowed_size_in_bytes)
        conf.batching_max_publish_delay_ms(batching_max_publish_delay_ms)
        conf.partitions_routing_mode(message_routing_mode)
        conf.batching_type(batching_type)
        conf.chunking_enabled(chunking_enabled)
        conf.lazy_start_partitioned_producers(lazy_start_partitioned_producers)
        conf.access_mode(access_mode)
        if producer_name:
            conf.producer_name(producer_name)
        if initial_sequence_id:
            conf.initial_sequence_id(initial_sequence_id)
        if properties:
            for k, v in properties.items():
                conf.property(k, v)

        conf.schema(schema.schema_info())
        if encryption_key:
            conf.encryption_key(encryption_key)
        if crypto_key_reader:
            conf.crypto_key_reader(crypto_key_reader.cryptoKeyReader)

        if batching_enabled and chunking_enabled:
            raise ValueError("Batching and chunking of messages can't be enabled together.")

        p = Producer()
        p._producer = self._client.create_producer(topic, conf)
        p._schema = schema
        p._client = self._client
        return p

    def subscribe(self, topic, subscription_name,
                  consumer_type: ConsumerType = ConsumerType.Exclusive,
                  schema=schema.BytesSchema(),
                  message_listener=None,
                  receiver_queue_size=1000,
                  max_total_receiver_queue_size_across_partitions=50000,
                  consumer_name=None,
                  unacked_messages_timeout_ms=None,
                  broker_consumer_stats_cache_time_ms=30000,
                  negative_ack_redelivery_delay_ms=60000,
                  is_read_compacted=False,
                  properties=None,
                  pattern_auto_discovery_period=60,
                  initial_position: InitialPosition = InitialPosition.Latest,
                  crypto_key_reader: CryptoKeyReader = None,
                  replicate_subscription_state_enabled=False,
                  max_pending_chunked_message=10,
                  auto_ack_oldest_chunked_message_on_queue_full=False,
                  start_message_id_inclusive=False,
                  batch_receive_policy=None,
                  key_shared_policy=None,
                  batch_index_ack_enabled=False,
                  regex_subscription_mode: RegexSubscriptionMode = RegexSubscriptionMode.PersistentOnly,
                  dead_letter_policy: ConsumerDeadLetterPolicy = None,
                  ):
        """
        Subscribe to the given topic and subscription combination.

        Parameters
        ----------

        topic:
            The name of the topic, list of topics or regex pattern. This method will accept these forms:
            * ``topic='my-topic'``
            * ``topic=['topic-1', 'topic-2', 'topic-3']``
            * ``topic=re.compile('persistent://public/default/topic-*')``
        subscription_name: str
            The name of the subscription.
        consumer_type: ConsumerType, default=ConsumerType.Exclusive
            Select the subscription type to be used when subscribing to the topic.
        schema: pulsar.schema.Schema, default=pulsar.schema.BytesSchema
            Define the schema of the data that will be received by this consumer.
        message_listener: optional
            Sets a message listener for the consumer. When the listener is set, the application will
            receive messages through it. Calls to ``consumer.receive()`` will not be allowed.
            The listener function needs to accept (consumer, message), for example:

            .. code-block:: python

                def my_listener(consumer, message):
                    # process message
                    consumer.acknowledge(message)
        receiver_queue_size: int, default=1000
            Sets the size of the consumer receive queue. The consumer receive queue controls how many messages can be
            accumulated by the consumer before the application calls `receive()`. Using a higher value could potentially
            increase the consumer throughput at the expense of higher memory utilization. Setting the consumer queue
            size to zero decreases the throughput of the consumer by disabling pre-fetching of messages.

            This approach improves the message distribution on shared subscription by pushing messages only to those
            consumers that are ready to process them. Neither receive with timeout nor partitioned topics can be used
            if the consumer queue size is zero. The `receive()` function call should not be interrupted when the
            consumer queue size is zero. The default value is 1000 messages and should work well for most use cases.
        max_total_receiver_queue_size_across_partitions: int, default=50000
            Set the max total receiver queue size across partitions. This setting will be used to reduce the
            receiver queue size for individual partitions
        consumer_name: str, optional
            Sets the consumer name.
        unacked_messages_timeout_ms: int, optional
            Sets the timeout in milliseconds for unacknowledged messages. The timeout needs to be greater than
            10 seconds. An exception is thrown if the given value is less than 10 seconds. If a successful
            acknowledgement is not sent within the timeout, all the unacknowledged messages are redelivered.
        negative_ack_redelivery_delay_ms: int, default=60000
            The delay after which to redeliver the messages that failed to be processed
            (with the ``consumer.negative_acknowledge()``)
        broker_consumer_stats_cache_time_ms: int, default=30000
            Sets the time duration for which the broker-side consumer stats will be cached in the client.
        is_read_compacted: bool, default=False
            Selects whether to read the compacted version of the topic
        properties: dict, optional
            Sets the properties for the consumer. The properties associated with a consumer can be used for
            identify a consumer at broker side.
        pattern_auto_discovery_period: int, default=60
            Periods of seconds for consumer to auto discover match topics.
        initial_position: InitialPosition, default=InitialPosition.Latest
          Set the initial position of a consumer when subscribing to the topic.
          It could be either: ``InitialPosition.Earliest`` or ``InitialPosition.Latest``.
        crypto_key_reader: CryptoKeyReader, optional
            Symmetric encryption class implementation, configuring public key encryption messages for the producer
            and private key decryption messages for the consumer
        replicate_subscription_state_enabled: bool, default=False
            Set whether the subscription status should be replicated.
        max_pending_chunked_message: int, default=10
          Consumer buffers chunk messages into memory until it receives all the chunks of the original message.
          While consuming chunk-messages, chunks from same message might not be contiguous in the stream, and they
          might be mixed with other messages' chunks. so, consumer has to maintain multiple buffers to manage
          chunks coming from different messages. This mainly happens when multiple publishers are publishing
          messages on the topic concurrently or publisher failed to publish all chunks of the messages.

          If it's zero, the pending chunked messages will not be limited.
        auto_ack_oldest_chunked_message_on_queue_full: bool, default=False
          Buffering large number of outstanding uncompleted chunked messages can create memory pressure, and it
          can be guarded by providing the maxPendingChunkedMessage threshold. See setMaxPendingChunkedMessage.
          Once, consumer reaches this threshold, it drops the outstanding unchunked-messages by silently acking
          if autoAckOldestChunkedMessageOnQueueFull is true else it marks them for redelivery.
        start_message_id_inclusive: bool, default=False
          Set the consumer to include the given position of any reset operation like Consumer::seek.
        batch_receive_policy: class ConsumerBatchReceivePolicy
          Set the batch collection policy for batch receiving.
        key_shared_policy: class ConsumerKeySharedPolicy
            Set the key shared policy for use when the ConsumerType is KeyShared.
        batch_index_ack_enabled: Enable the batch index acknowledgement.
            It should be noted that this option can only work when the broker side also enables the batch index
            acknowledgement. See the `acknowledgmentAtBatchIndexLevelEnabled` config in `broker.conf`.
        regex_subscription_mode: RegexSubscriptionMode, optional
            Set the regex subscription mode for use when the topic is a regex pattern.

            Supported modes:

            * PersistentOnly: By default only subscribe to persistent topics.
            * NonPersistentOnly: Only subscribe to non-persistent topics.
            * AllTopics: Subscribe to both persistent and non-persistent topics.
        dead_letter_policy: class ConsumerDeadLetterPolicy
          Set dead letter policy for consumer.
          By default, some messages are redelivered many times, even to the extent that they can never be
          stopped. By using the dead letter mechanism, messages have the max redelivery count, when they're
          exceeding the maximum number of redeliveries. Messages are sent to dead letter topics and acknowledged
          automatically.
        """
        _check_type(str, subscription_name, 'subscription_name')
        _check_type(ConsumerType, consumer_type, 'consumer_type')
        _check_type(_schema.Schema, schema, 'schema')
        _check_type(int, receiver_queue_size, 'receiver_queue_size')
        _check_type(int, max_total_receiver_queue_size_across_partitions,
                    'max_total_receiver_queue_size_across_partitions')
        _check_type_or_none(str, consumer_name, 'consumer_name')
        _check_type_or_none(int, unacked_messages_timeout_ms, 'unacked_messages_timeout_ms')
        _check_type(int, broker_consumer_stats_cache_time_ms, 'broker_consumer_stats_cache_time_ms')
        _check_type(int, negative_ack_redelivery_delay_ms, 'negative_ack_redelivery_delay_ms')
        _check_type(int, pattern_auto_discovery_period, 'pattern_auto_discovery_period')
        _check_type(bool, is_read_compacted, 'is_read_compacted')
        _check_type_or_none(dict, properties, 'properties')
        _check_type(InitialPosition, initial_position, 'initial_position')
        _check_type_or_none(CryptoKeyReader, crypto_key_reader, 'crypto_key_reader')
        _check_type(int, max_pending_chunked_message, 'max_pending_chunked_message')
        _check_type(bool, auto_ack_oldest_chunked_message_on_queue_full, 'auto_ack_oldest_chunked_message_on_queue_full')
        _check_type(bool, start_message_id_inclusive, 'start_message_id_inclusive')
        _check_type_or_none(ConsumerBatchReceivePolicy, batch_receive_policy, 'batch_receive_policy')
        _check_type_or_none(ConsumerKeySharedPolicy, key_shared_policy, 'key_shared_policy')
        _check_type(bool, batch_index_ack_enabled, 'batch_index_ack_enabled')
        _check_type(RegexSubscriptionMode, regex_subscription_mode, 'regex_subscription_mode')

        conf = _pulsar.ConsumerConfiguration()
        conf.consumer_type(consumer_type)
        conf.regex_subscription_mode(regex_subscription_mode)
        conf.read_compacted(is_read_compacted)
        if message_listener:
            conf.message_listener(_listener_wrapper(message_listener, schema))
        conf.receiver_queue_size(receiver_queue_size)
        conf.max_total_receiver_queue_size_across_partitions(max_total_receiver_queue_size_across_partitions)
        if consumer_name:
            conf.consumer_name(consumer_name)
        if unacked_messages_timeout_ms:
            conf.unacked_messages_timeout_ms(unacked_messages_timeout_ms)

        conf.negative_ack_redelivery_delay_ms(negative_ack_redelivery_delay_ms)
        conf.broker_consumer_stats_cache_time_ms(broker_consumer_stats_cache_time_ms)
        if properties:
            for k, v in properties.items():
                conf.property(k, v)
        conf.subscription_initial_position(initial_position)

        conf.schema(schema.schema_info())

        if crypto_key_reader:
            conf.crypto_key_reader(crypto_key_reader.cryptoKeyReader)

        conf.replicate_subscription_state_enabled(replicate_subscription_state_enabled)
        conf.max_pending_chunked_message(max_pending_chunked_message)
        conf.auto_ack_oldest_chunked_message_on_queue_full(auto_ack_oldest_chunked_message_on_queue_full)
        conf.start_message_id_inclusive(start_message_id_inclusive)
        if batch_receive_policy:
            conf.batch_receive_policy(batch_receive_policy.policy())

        if key_shared_policy:
            conf.key_shared_policy(key_shared_policy.policy())
        conf.batch_index_ack_enabled(batch_index_ack_enabled)
        if dead_letter_policy:
            conf.dead_letter_policy(dead_letter_policy.policy())

        c = Consumer()
        if isinstance(topic, str):
            # Single topic
            c._consumer = self._client.subscribe(topic, subscription_name, conf)
        elif isinstance(topic, list):
            # List of topics
            c._consumer = self._client.subscribe_topics(topic, subscription_name, conf)
        elif isinstance(topic, _retype):
            # Regex pattern
            c._consumer = self._client.subscribe_pattern(topic.pattern, subscription_name, conf)
        else:
            raise ValueError("Argument 'topic' is expected to be of a type between (str, list, re.pattern)")

        c._client = self
        c._schema = schema
        c._schema.attach_client(self._client)
        self._consumers.append(c)
        return c

    def create_reader(self, topic, start_message_id,
                      schema=schema.BytesSchema(),
                      reader_listener=None,
                      receiver_queue_size=1000,
                      reader_name=None,
                      subscription_role_prefix=None,
                      is_read_compacted=False,
                      crypto_key_reader: CryptoKeyReader = None,
                      start_message_id_inclusive=False
                      ):
        """
        Create a reader on a particular topic

        Parameters
        ----------

        topic:
            The name of the topic.
        start_message_id:
            The initial reader positioning is done by specifying a message id. The options are:

            * ``MessageId.earliest``:

            Start reading from the earliest message available in the topic

            * ``MessageId.latest``:

            Start reading from the end topic, only getting messages published after the reader was created

            * ``MessageId``:

            When passing a particular message id, the reader will position itself on that specific position.
            The first message to be read will be the message next to the specified messageId.
            Message id can be serialized into a string and deserialized back into a `MessageId` object:

               .. code-block:: python

                   # Serialize to string
                   s = msg.message_id().serialize()

                   # Deserialize from string
                   msg_id = MessageId.deserialize(s)
        schema: pulsar.schema.Schema, default=pulsar.schema.BytesSchema
            Define the schema of the data that will be received by this reader.
        reader_listener: optional
            Sets a message listener for the reader. When the listener is set, the application will receive messages
            through it. Calls to ``reader.read_next()`` will not be allowed. The listener function needs to accept
            (reader, message), for example:

            .. code-block:: python

                def my_listener(reader, message):
                    # process message
                    pass
        receiver_queue_size: int, default=1000
            Sets the size of the reader receive queue. The reader receive queue controls how many messages can be
            accumulated by the reader before the application calls `read_next()`. Using a higher value could
            potentially increase the reader throughput at the expense of higher memory utilization.
        reader_name: str, optional
            Sets the reader name.
        subscription_role_prefix: str, optional
            Sets the subscription role prefix.
        is_read_compacted: bool, default=False
            Selects whether to read the compacted version of the topic
        crypto_key_reader: CryptoKeyReader, optional
            Symmetric encryption class implementation, configuring public key encryption messages for the producer
            and private key decryption messages for the consumer
        start_message_id_inclusive: bool, default=False
            Set the reader to include the startMessageId or given position of any reset operation like Reader.seek
        """

        # If a pulsar.MessageId object is passed, access the _pulsar.MessageId object
        if isinstance(start_message_id, MessageId):
            start_message_id = start_message_id._msg_id

        _check_type(str, topic, 'topic')
        _check_type(_pulsar.MessageId, start_message_id, 'start_message_id')
        _check_type(_schema.Schema, schema, 'schema')
        _check_type(int, receiver_queue_size, 'receiver_queue_size')
        _check_type_or_none(str, reader_name, 'reader_name')
        _check_type_or_none(str, subscription_role_prefix, 'subscription_role_prefix')
        _check_type(bool, is_read_compacted, 'is_read_compacted')
        _check_type_or_none(CryptoKeyReader, crypto_key_reader, 'crypto_key_reader')
        _check_type(bool, start_message_id_inclusive, 'start_message_id_inclusive')

        conf = _pulsar.ReaderConfiguration()
        if reader_listener:
            conf.reader_listener(_listener_wrapper(reader_listener, schema))
        conf.receiver_queue_size(receiver_queue_size)
        if reader_name:
            conf.reader_name(reader_name)
        if subscription_role_prefix:
            conf.subscription_role_prefix(subscription_role_prefix)
        conf.schema(schema.schema_info())
        conf.read_compacted(is_read_compacted)
        if crypto_key_reader:
            conf.crypto_key_reader(crypto_key_reader.cryptoKeyReader)
        conf.start_message_id_inclusive(start_message_id_inclusive)

        c = Reader()
        c._reader = self._client.create_reader(topic, start_message_id, conf)
        c._client = self
        c._schema = schema
        c._schema.attach_client(self._client)
        self._consumers.append(c)
        return c

    def get_topic_partitions(self, topic):
        """
        Get the list of partitions for a given topic.

        If the topic is partitioned, this will return a list of partition names. If the topic is not
        partitioned, the returned list will contain the topic name itself.

        This can be used to discover the partitions and create Reader, Consumer or Producer
        instances directly on a particular partition.

        Parameters
        ----------

        topic: str
            the topic name to lookup

        Returns
        -------
        list
            a list of partition name
        """
        _check_type(str, topic, 'topic')
        return self._client.get_topic_partitions(topic)

    def shutdown(self):
        """
        Perform immediate shutdown of Pulsar client.

        Release all resources and close all producer, consumer, and readers without waiting
        for ongoing operations to complete.
        """
        self._client.shutdown()

    def close(self):
        """
        Close the client and all the associated producers and consumers
        """
        self._client.close()


class Producer:
    """
    The Pulsar message producer, used to publish messages on a topic.

    Examples
    --------

    .. code-block:: python

        import pulsar

        client = pulsar.Client('pulsar://localhost:6650')
        producer = client.create_producer('my-topic')
        for i in range(10):
            producer.send(('Hello-%d' % i).encode('utf-8'))
        client.close()
    """

    def topic(self):
        """
        Return the topic which producer is publishing to
        """
        return self._producer.topic()

    def producer_name(self):
        """
        Return the producer name which could have been assigned by the
        system or specified by the client
        """
        return self._producer.producer_name()

    def last_sequence_id(self):
        """
        Get the last sequence id that was published by this producer.

        This represents either the automatically assigned or custom sequence id
        (set on the ``MessageBuilder``) that was published and acknowledged by the broker.

        After recreating a producer with the same producer name, this will return the
        last message that was published in the previous producer session, or -1 if
        there was no message ever published.
        """
        return self._producer.last_sequence_id()

    def send(self, content,
             properties=None,
             partition_key=None,
             ordering_key=None,
             sequence_id=None,
             replication_clusters=None,
             disable_replication=False,
             event_timestamp=None,
             deliver_at=None,
             deliver_after=None,
             ):
        """
        Publish a message on the topic. Blocks until the message is acknowledged

        Returns a `MessageId` object that represents where the message is persisted.

        Parameters
        ----------

        content:
            A ``bytes`` object with the message payload.
        properties: optional
            A dict of application-defined string properties.
        partition_key: optional
            Sets the partition key for message routing. A hash of this key is used
            to determine the message's topic partition.
        ordering_key: optional
            Sets the ordering key for message routing.
        sequence_id:  optional
            Specify a custom sequence id for the message being published.
        replication_clusters:  optional
          Override namespace replication clusters. Note that it is the caller's responsibility to provide valid
          cluster names and that all clusters have been previously configured as topics. Given an empty list,
          the message will replicate according to the namespace configuration.
        disable_replication: bool, default=False
            Do not replicate this message.
        event_timestamp: optional
            Timestamp in millis of the timestamp of event creation
        deliver_at: optional
            Specify the message should not be delivered earlier than the specified timestamp.
            The timestamp is milliseconds and based on UTC
        deliver_after: optional
            Specify a delay in timedelta for the delivery of the messages.
        """
        msg = self._build_msg(content, properties, partition_key, ordering_key, sequence_id,
                              replication_clusters, disable_replication, event_timestamp,
                              deliver_at, deliver_after)
        return self._producer.send(msg)

    def send_async(self, content, callback,
                   properties=None,
                   partition_key=None,
                   ordering_key=None,
                   sequence_id=None,
                   replication_clusters=None,
                   disable_replication=False,
                   event_timestamp=None,
                   deliver_at=None,
                   deliver_after=None,
                   ):
        """
        Send a message asynchronously.

        Examples
        --------

        The ``callback`` will be invoked once the message has been acknowledged by the broker.

        .. code-block:: python

            import pulsar

            client = pulsar.Client('pulsar://localhost:6650')
            producer = client.create_producer(
                            'my-topic',
                            block_if_queue_full=True,
                            batching_enabled=True,
                            batching_max_publish_delay_ms=10)

            def callback(res, msg_id):
                print('Message published res=%s', res)

            while True:
                producer.send_async(('Hello-%d' % i).encode('utf-8'), callback)

            client.close()


        When the producer queue is full, by default the message will be rejected
        and the callback invoked with an error code.


        Parameters
        ----------

        content
            A `bytes` object with the message payload.
        callback
            A callback that is invoked once the message has been acknowledged by the broker.
        properties: optional
            A dict of application0-defined string properties.
        partition_key: optional
            Sets the partition key for the message routing. A hash of this key is
            used to determine the message's topic partition.
        ordering_key: optional
            Sets the ordering key for the message routing.
        sequence_id: optional
            Specify a custom sequence id for the message being published.
        replication_clusters: optional
            Override namespace replication clusters. Note that it is the caller's responsibility
            to provide valid cluster names and that all clusters have been previously configured
            as topics. Given an empty list, the message will replicate per the namespace configuration.
        disable_replication: optional
            Do not replicate this message.
        event_timestamp: optional
            Timestamp in millis of the timestamp of event creation
        deliver_at: optional
            Specify the message should not be delivered earlier than the specified timestamp.
        deliver_after: optional
            Specify a delay in timedelta for the delivery of the messages.
        """
        msg = self._build_msg(content, properties, partition_key, ordering_key, sequence_id,
                              replication_clusters, disable_replication, event_timestamp,
                              deliver_at, deliver_after)
        self._producer.send_async(msg, callback)


    def flush(self):
        """
        Flush all the messages buffered in the client and wait until all messages have been
        successfully persisted
        """
        self._producer.flush()


    def close(self):
        """
        Close the producer.
        """
        self._producer.close()

    def _build_msg(self, content, properties, partition_key, ordering_key, sequence_id,
                   replication_clusters, disable_replication, event_timestamp,
                   deliver_at, deliver_after):
        data = self._schema.encode(content)

        _check_type(bytes, data, 'data')
        _check_type_or_none(dict, properties, 'properties')
        _check_type_or_none(str, partition_key, 'partition_key')
        _check_type_or_none(str, ordering_key, 'ordering_key')
        _check_type_or_none(int, sequence_id, 'sequence_id')
        _check_type_or_none(list, replication_clusters, 'replication_clusters')
        _check_type(bool, disable_replication, 'disable_replication')
        _check_type_or_none(int, event_timestamp, 'event_timestamp')
        _check_type_or_none(int, deliver_at, 'deliver_at')
        _check_type_or_none(timedelta, deliver_after, 'deliver_after')

        mb = _pulsar.MessageBuilder()
        mb.content(data)
        if properties:
            for k, v in properties.items():
                mb.property(k, v)
        if partition_key:
            mb.partition_key(partition_key)
        if ordering_key:
            mb.ordering_key(ordering_key)
        if sequence_id:
            mb.sequence_id(sequence_id)
        if replication_clusters:
            mb.replication_clusters(replication_clusters)
        if disable_replication:
            mb.disable_replication(disable_replication)
        if event_timestamp:
            mb.event_timestamp(event_timestamp)
        if deliver_at:
            mb.deliver_at(deliver_at)
        if deliver_after:
            mb.deliver_after(deliver_after)

        return mb.build()

    def is_connected(self):
        """
        Check if the producer is connected or not.
        """
        return self._producer.is_connected()


class Consumer:
    """
    Pulsar consumer.

    Examples
    --------

    .. code-block:: python

        import pulsar

        client = pulsar.Client('pulsar://localhost:6650')
        consumer = client.subscribe('my-topic', 'my-subscription')
        while True:
            msg = consumer.receive()
            try:
                print("Received message '{}' id='{}'".format(msg.data(), msg.message_id()))
                consumer.acknowledge(msg)
            except Exception:
                consumer.negative_acknowledge(msg)
        client.close()
    """

    def topic(self):
        """
        Return the topic this consumer is subscribed to.
        """
        return self._consumer.topic()

    def subscription_name(self):
        """
        Return the subscription name.
        """
        return self._consumer.subscription_name()

    def unsubscribe(self):
        """
        Unsubscribe the current consumer from the topic.

        This method will block until the operation is completed. Once the
        consumer is unsubscribed, no more messages will be received and
        subsequent new messages will not be retained for this consumer.

        This consumer object cannot be reused.
        """
        return self._consumer.unsubscribe()

    def receive(self, timeout_millis=None):
        """
        Receive a single message.

        If a message is not immediately available, this method will block until
        a new message is available.

        Parameters
        ----------

        timeout_millis: int, optional
            If specified, the receiver will raise an exception if a message is not available within the timeout.
        """
        if timeout_millis is None:
            msg = self._consumer.receive()
        else:
            _check_type(int, timeout_millis, 'timeout_millis')
            msg = self._consumer.receive(timeout_millis)

        m = Message()
        m._message = msg
        m._schema = self._schema
        return m

    def batch_receive(self):
        """
        Batch receiving messages.

        This calls blocks until has enough messages or wait timeout, more details to see {@link BatchReceivePolicy}.
        """
        messages = []
        msgs = self._consumer.batch_receive()
        for msg in msgs:
            m = Message()
            m._message = msg
            messages.append(m)
        return messages

    def acknowledge(self, message):
        """
        Acknowledge the reception of a single message.

        This method will block until an acknowledgement is sent to the broker.
        After that, the message will not be re-delivered to this consumer.

        Parameters
        ----------
        message : Message, _pulsar.Message, _pulsar.MessageId
            The received message or message id.

        Raises
        ------
        OperationNotSupported
             if ``message`` is not allowed to acknowledge
        """
        if isinstance(message, Message):
            self._consumer.acknowledge(message._message)
        else:
            self._consumer.acknowledge(message)

    def acknowledge_cumulative(self, message):
        """
        Acknowledge the reception of all the messages in the stream up to (and
        including) the provided message.

        This method will block until an acknowledgement is sent to the broker.
        After that, the messages will not be re-delivered to this consumer.

        Parameters
        ----------

        message:
            The received message or message id.

        Raises
        ------
        CumulativeAcknowledgementNotAllowedError
            if the consumer type is ConsumerType.KeyShared or ConsumerType.Shared
        """
        if isinstance(message, Message):
            self._consumer.acknowledge_cumulative(message._message)
        else:
            self._consumer.acknowledge_cumulative(message)

    def negative_acknowledge(self, message):
        """
        Acknowledge the failure to process a single message.

        When a message is "negatively acked" it will be marked for redelivery after
        some fixed delay. The delay is configurable when constructing the consumer
        with {@link ConsumerConfiguration#setNegativeAckRedeliveryDelayMs}.

        This call is not blocking.

        Parameters
        ----------

        message:
            The received message or message id.
        """
        if isinstance(message, Message):
            self._consumer.negative_acknowledge(message._message)
        else:
            self._consumer.negative_acknowledge(message)

    def pause_message_listener(self):
        """
        Pause receiving messages via the ``message_listener`` until `resume_message_listener()` is called.
        """
        self._consumer.pause_message_listener()

    def resume_message_listener(self):
        """
        Resume receiving the messages via the message listener.
        Asynchronously receive all the messages enqueued from the time
        `pause_message_listener()` was called.
        """
        self._consumer.resume_message_listener()

    def redeliver_unacknowledged_messages(self):
        """
        Redelivers all the unacknowledged messages. In failover mode, the
        request is ignored if the consumer is not active for the given topic. In
        shared mode, the consumer's messages to be redelivered are distributed
        across all the connected consumers. This is a non-blocking call and
        doesn't throw an exception. In case the connection breaks, the messages
        are redelivered after reconnect.
        """
        self._consumer.redeliver_unacknowledged_messages()

    def seek(self, messageid):
        """
        Reset the subscription associated with this consumer to a specific message id or publish timestamp.
        The message id can either be a specific message or represent the first or last messages in the topic.
        Note: this operation can only be done on non-partitioned topics. For these, one can rather perform the
        seek() on the individual partitions.

        Parameters
        ----------

        messageid:
            The message id for seek, OR an integer event time to seek to
        """
        self._consumer.seek(messageid)

    def close(self):
        """
        Close the consumer.
        """
        self._consumer.close()
        self._client._consumers.remove(self)

    def is_connected(self):
        """
        Check if the consumer is connected or not.
        """
        return self._consumer.is_connected()

    def get_last_message_id(self):
        """
        Get the last message id.
        """
        return self._consumer.get_last_message_id()

class ConsumerBatchReceivePolicy:
    """
    Batch receive policy can limit the number and bytes of messages in a single batch,
    and can specify a timeout for waiting for enough messages for this batch.

    A batch receive action is completed as long as any one of the conditions (the batch has enough number
    or size of messages, or the waiting timeout is passed) are met.
    """
    def __init__(self, max_num_message, max_num_bytes, timeout_ms):
        """
        Wrapper BatchReceivePolicy.

        Parameters
        ----------

        max_num_message: Max num message, if less than 0, it means no limit. default: -1
        max_num_bytes: Max num bytes, if less than 0, it means no limit. default: 10 * 1024 * 1024
        timeout_ms: If less than 0, it means no limit. default: 100
        """
        self._policy = BatchReceivePolicy(max_num_message, max_num_bytes, timeout_ms)

    def policy(self):
        """
        Returns the actual one BatchReceivePolicy.
        """
        return self._policy

class ConsumerKeySharedPolicy:
    """
    Consumer key shared policy is used to configure the consumer behaviour when the ConsumerType is KeyShared.
    """
    def __init__(
            self,
            key_shared_mode: KeySharedMode = KeySharedMode.AutoSplit,
            allow_out_of_order_delivery: bool = False,
            sticky_ranges: Optional[List[Tuple[int, int]]] = None,
    ):
        """
        Wrapper KeySharedPolicy.

        Parameters
        ----------

        key_shared_mode: KeySharedMode, optional
            Set the key shared mode. eg: KeySharedMode.Sticky or KeysharedMode.AutoSplit

        allow_out_of_order_delivery: bool, optional
            Set whether to allow for out of order delivery
            If it is enabled, it relaxes the ordering requirement and allows the broker to send out-of-order
            messages in case of failures. This makes it faster for new consumers to join without being stalled by
            an existing slow consumer.

            If this is True, a single consumer still receives all keys, but they may come in different orders.

        sticky_ranges: List[Tuple[int, int]], optional
            Set the ranges used with sticky mode. The integers can be from 0 to 2^16 (0 <= val < 65,536)
        """
        if key_shared_mode == KeySharedMode.Sticky and sticky_ranges is None:
            raise ValueError("When using key_shared_mode = KeySharedMode.Sticky you must also provide sticky_ranges")

        self._policy = KeySharedPolicy()
        self._policy.set_key_shared_mode(key_shared_mode)
        self._policy.set_allow_out_of_order_delivery(allow_out_of_order_delivery)

        if sticky_ranges is not None:
            self._policy.set_sticky_ranges(sticky_ranges)

    @property
    def key_shared_mode(self) -> KeySharedMode:
        """
        Returns the key shared mode
        """
        return self._policy.get_key_shared_mode()

    @property
    def allow_out_of_order_delivery(self) -> bool:
        """
        Returns whether out of order delivery is enabled
        """
        return self._policy.is_allow_out_of_order_delivery()

    @property
    def sticky_ranges(self) -> List[Tuple[int, int]]:
        """
        Returns the actual sticky ranges
        """
        return self._policy.get_sticky_ranges()

    def policy(self):
        """
        Returns the actual KeySharedPolicy.
        """
        return self._policy

class Reader:
    """
    Pulsar topic reader.
    """

    def topic(self):
        """
        Return the topic this reader is reading from.
        """
        return self._reader.topic()

    def read_next(self, timeout_millis=None):
        """
        Read a single message.

        If a message is not immediately available, this method will block until
        a new message is available.

        Parameters
        ----------

        timeout_millis: int, optional
            If specified, the receiver will raise an exception if a message is not available within the timeout.
        """
        if timeout_millis is None:
            msg = self._reader.read_next()
        else:
            _check_type(int, timeout_millis, 'timeout_millis')
            msg = self._reader.read_next(timeout_millis)

        m = Message()
        m._message = msg
        m._schema = self._schema
        return m

    def has_message_available(self):
        """
        Check if there is any message available to read from the current position.
        """
        return self._reader.has_message_available();

    def seek(self, messageid):
        """
        Reset this reader to a specific message id or publish timestamp.
        The message id can either be a specific message or represent the first or last messages in the topic.
        Note: this operation can only be done on non-partitioned topics. For these, one can rather perform the
        seek() on the individual partitions.

        Parameters
        ----------

        messageid:
            The message id for seek, OR an integer event time to seek to
        """
        self._reader.seek(messageid)

    def close(self):
        """
        Close the reader.
        """
        self._reader.close()
        self._client._consumers.remove(self)

    def is_connected(self):
        """
        Check if the reader is connected or not.
        """
        return self._reader.is_connected()


class ConsoleLogger:
    """
    Logger that writes on standard output

    Attributes
    ----------

    log_level:
        The logging level, eg: ``pulsar.LoggerLevel.Info``
    """
    def __init__(self, log_level=_pulsar.LoggerLevel.Info):
        _check_type(_pulsar.LoggerLevel, log_level, 'log_level')
        self.log_level = log_level


class FileLogger:
    """
    Logger that writes into a file

    Attributes
    ----------

    log_level:
        The logging level, eg: ``pulsar.LoggerLevel.Info``
    log_file:
        The file where to write the logs
    """
    def __init__(self, log_level, log_file):
        _check_type(_pulsar.LoggerLevel, log_level, 'log_level')
        _check_type(str, log_file, 'log_file')
        self.log_level = log_level
        self.log_file = log_file


def _check_type(var_type, var, name):
    if not isinstance(var, var_type):
        raise ValueError("Argument %s is expected to be of type '%s' and not '%s'"
                         % (name, var_type.__name__, type(var).__name__))


def _check_type_or_none(var_type, var, name):
    if var is not None and not isinstance(var, var_type):
        raise ValueError("Argument %s is expected to be either None or of type '%s'"
                         % (name, var_type.__name__))


def _listener_wrapper(listener, schema):
    def wrapper(consumer, msg):
        c = Consumer()
        c._consumer = consumer
        m = Message()
        m._message = msg
        m._schema = schema
        listener(c, m)
    return wrapper
