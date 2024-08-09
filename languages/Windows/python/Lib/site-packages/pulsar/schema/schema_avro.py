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

import _pulsar
import io
import json
import logging
import enum

from . import Record
from .schema import Schema

try:
    import fastavro
    HAS_AVRO = True
except ImportError:
    HAS_AVRO = False

if HAS_AVRO:
    class AvroSchema(Schema):
        def __init__(self, record_cls, schema_definition=None):
            if record_cls is None and schema_definition is None:
                raise AssertionError("The param record_cls and schema_definition shouldn't be both None.")

            if record_cls is not None:
                self._schema = record_cls.schema()
            else:
                self._schema = schema_definition
            self._writer_schemas = dict()
            self._logger = logging.getLogger()
            super(AvroSchema, self).__init__(record_cls, _pulsar.SchemaType.AVRO, self._schema, 'AVRO')

        def _get_serialized_value(self, x):
            if isinstance(x, enum.Enum):
                return x.name
            elif isinstance(x, Record):
                return self.encode_dict(x.__dict__)
            elif isinstance(x, list):
                arr = []
                for item in x:
                    arr.append(self._get_serialized_value(item))
                return arr
            elif isinstance(x, dict):
                return self.encode_dict(x)
            else:
                return x

        def encode(self, obj):
            buffer = io.BytesIO()
            m = obj
            if self._record_cls is not None:
                self._validate_object_type(obj)
                m = self.encode_dict(obj.__dict__)
            elif not isinstance(obj, dict):
                raise ValueError('If using the custom schema, the record data should be dict type.')

            fastavro.schemaless_writer(buffer, self._schema, m)
            return buffer.getvalue()

        def encode_dict(self, d):
            obj = {}
            for k, v in d.items():
                obj[k] = self._get_serialized_value(v)
            return obj

        def decode(self, data):
            return self._decode_bytes(data, self._schema)

        def decode_message(self, msg: _pulsar.Message):
            if self._client is None:
                return self.decode(msg.data())
            topic = msg.topic_name()
            version = msg.int_schema_version()
            try:
                writer_schema = self._get_writer_schema(topic, version)
                return self._decode_bytes(msg.data(), writer_schema)
            except Exception as e:
                self._logger.error(f'Failed to get schema info of {topic} version {version}: {e}')
                return self._decode_bytes(msg.data(), self._schema)

        def _get_writer_schema(self, topic: str, version: int) -> 'dict':
            if self._writer_schemas.get(topic) is None:
                self._writer_schemas[topic] = dict()
            writer_schema = self._writer_schemas[topic].get(version)
            if writer_schema is not None:
                return writer_schema
            if self._client is None:
                return self._schema

            self._logger.info('Downloading schema of %s version %d...', topic, version)
            info = self._client.get_schema_info(topic, version)
            self._logger.info('Downloaded schema of %s version %d', topic, version)
            if info.schema_type() != _pulsar.SchemaType.AVRO:
                raise RuntimeError(f'The schema type of topic "{topic}" and version {version}'
                                   f' is {info.schema_type()}')
            writer_schema = json.loads(info.schema())
            self._writer_schemas[topic][version] = writer_schema
            return writer_schema

        def _decode_bytes(self, data: bytes, writer_schema: dict):
            buffer = io.BytesIO(data)
            # If the record names are different between the writer schema and the reader schema,
            # schemaless_reader will fail with fastavro._read_common.SchemaResolutionError.
            # So we make the record name fields consistent here.
            reader_schema: dict = self._schema
            writer_schema['name'] = reader_schema['name']
            d = fastavro.schemaless_reader(buffer, writer_schema, reader_schema)
            if self._record_cls is not None:
                return self._record_cls(**d)
            else:
                return d

else:
    class AvroSchema(Schema):
        def __init__(self, _record_cls, _schema_definition=None):
            raise Exception("Avro library support was not found. Make sure to install Pulsar client " +
                            "with Avro support: pip3 install 'pulsar-client[avro]'")

        def encode(self, obj):
            pass

        def decode(self, data):
            pass
