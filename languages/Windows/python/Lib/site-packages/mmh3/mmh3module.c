// To handle 64-bit data; see https://docs.python.org/3/c-api/arg.html
#ifndef PY_SSIZE_T_CLEAN
#define PY_SSIZE_T_CLEAN
#endif

#include <Python.h>
#include <stdio.h>
#include <string.h>

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
#include <byteswap.h>
#endif

#include "hashlib.h"
#include "murmurhash3.h"

#if defined(_MSC_VER)
typedef signed __int8 int8_t;
typedef signed __int32 int32_t;
typedef signed __int64 int64_t;
typedef unsigned __int8 uint8_t;
typedef unsigned __int32 uint32_t;
typedef unsigned __int64 uint64_t;
// Other compilers
#else  // defined(_MSC_VER)
#include <stdint.h>
#endif  // defined(_MSC_VER)

#define MMH3_32_DIGESTSIZE 4
#define MMH3_128_DIGESTSIZE 16

#define MMH3_32_BLOCKSIZE 12
#define MMH3_128_BLOCKSIZE 32

//-----------------------------------------------------------------------------
// One shot functions

PyDoc_STRVAR(mmh3_hash_doc,
             "hash(key[, seed=0, signed=True]) -> 32-bit int\n\n"
             "Return a hash value as a 32-bit integer. "
             "Calculated by the MurmurHash3_x86_32 algorithm.");

static PyObject *
mmh3_hash(PyObject *self, PyObject *args, PyObject *keywds)
{
    const char *target_str;
    Py_ssize_t target_str_len;
    uint32_t seed = 0;
    int32_t result[1];
    long long_result = 0;
    unsigned char is_signed = 1;

    static char *kwlist[] = {(char *)"key", (char *)"seed", (char *)"signed",
                             NULL};

#ifndef _MSC_VER
#if __LONG_WIDTH__ == 64 || defined(__APPLE__)
    static uint64_t mask[] = {0x0ffffffff, 0xffffffffffffffff};
#endif
#endif

    if (!PyArg_ParseTupleAndKeywords(args, keywds, "s#|IB", kwlist,
                                     &target_str, &target_str_len, &seed,
                                     &is_signed)) {
        return NULL;
    }

    murmurhash3_x86_32(target_str, target_str_len, seed, result);

#if defined(_MSC_VER)
    /* for Windows envs */
    long_result = result[0];
    if (is_signed == 1) {
        return PyLong_FromLong(long_result);
    }
    else {
        return PyLong_FromUnsignedLong(long_result);
    }
#else  // defined(_MSC_VER)
    /* for standard envs */
#if __LONG_WIDTH__ == 64 || defined(__APPLE__)
    long_result = result[0] & mask[is_signed];
    return PyLong_FromLong(long_result);
#else   // __LONG_WIDTH__ == 64 || defined(__APPLE__)
    long_result = result[0];
    if (is_signed == 1) {
        return PyLong_FromLong(long_result);
    }
    else {
        return PyLong_FromUnsignedLong(long_result);
    }
#endif  // __LONG_WIDTH__ == 64 || defined(__APPLE__)
#endif  // defined(_MSC_VER)
}

PyDoc_STRVAR(mmh3_hash_from_buffer_doc,
             "hash_from_buffer(key[, seed=0, signed=True]) -> 32-bit int\n\n"
             "Return a hash value from a memory buffer as a 32-bit integer. "
             "Calculated by the MurmurHash3_x86_32 algorithm. "
             "Designed for large memory-views such as numpy arrays.");

static PyObject *
mmh3_hash_from_buffer(PyObject *self, PyObject *args, PyObject *keywds)
{
    Py_buffer target_buf;
    uint32_t seed = 0;
    int32_t result[1];
    long long_result = 0;
    unsigned char is_signed = 1;

    static char *kwlist[] = {(char *)"key", (char *)"seed", (char *)"signed",
                             NULL};

#ifndef _MSC_VER
#if __LONG_WIDTH__ == 64 || defined(__APPLE__)
    static uint64_t mask[] = {0x0ffffffff, 0xffffffffffffffff};
#endif
#endif

    if (!PyArg_ParseTupleAndKeywords(args, keywds, "s*|IB", kwlist,
                                     &target_buf, &seed, &is_signed)) {
        return NULL;
    }

    murmurhash3_x86_32(target_buf.buf, target_buf.len, seed, result);

#if defined(_MSC_VER)
    /* for Windows envs */
    long_result = result[0];
    if (is_signed == 1) {
        return PyLong_FromLong(long_result);
    }
    else {
        return PyLong_FromUnsignedLong(long_result);
    }
#else  // defined(_MSC_VER)
/* for standard envs */
#if __LONG_WIDTH__ == 64 || defined(__APPLE__)
    long_result = result[0] & mask[is_signed];
    return PyLong_FromLong(long_result);
#else   // __LONG_WIDTH__ == 64 || defined(__APPLE__)
    long_result = result[0];
    if (is_signed == 1) {
        return PyLong_FromLong(long_result);
    }
    else {
        return PyLong_FromUnsignedLong(long_result);
    }
#endif  // __LONG_WIDTH__ == 64 || defined(__APPLE__)
#endif  // defined(_MSC_VER)
}

PyDoc_STRVAR(
    mmh3_hash64_doc,
    "hash64(key[, seed=0, x64arch=True, signed=True]) -> (64-bit int, 64-bit "
    "int)\n\n"
    "Return a tuple of two 64 bit integers given an input string. "
    "Calculated by the MurmurHash3_x{64, 86}_128 algorithm. Optimized "
    "for the x64 bit architecture when x64arch=True, otherwise for x86.");

static PyObject *
mmh3_hash64(PyObject *self, PyObject *args, PyObject *keywds)
{
    const char *target_str;
    Py_ssize_t target_str_len;
    uint32_t seed = 0;
    uint64_t result[2];
    unsigned char x64arch = 1;
    unsigned char is_signed = 1;

    static char *kwlist[] = {(char *)"key", (char *)"seed", (char *)"x64arch",
                             (char *)"signed", NULL};

    static char *valflag[] = {(char *)"KK", (char *)"LL"};

    if (!PyArg_ParseTupleAndKeywords(args, keywds, "s#|IBB", kwlist,
                                     &target_str, &target_str_len, &seed,
                                     &x64arch, &is_signed)) {
        return NULL;
    }

    if (x64arch == 1) {
        murmurhash3_x64_128(target_str, target_str_len, seed, result);
    }
    else {
        murmurhash3_x86_128(target_str, target_str_len, seed, result);
    }

    PyObject *retval = Py_BuildValue(valflag[is_signed], result[0], result[1]);
    return retval;
}

PyDoc_STRVAR(
    mmh3_hash128_doc,
    "hash128(key[, seed=0, x64arch=True, signed=False]]) -> 128-bit int\n\n"
    "Return a 128 bit long integer. "
    "Calculated by the MurmurHash3_x{64, 86}_128 algorithm. "
    "Optimized for the x64 bit architecture "
    "when x64arch=True, otherwise for x86.");

static PyObject *
mmh3_hash128(PyObject *self, PyObject *args, PyObject *keywds)
{
    const char *target_str;
    Py_ssize_t target_str_len;
    uint32_t seed = 0;
    uint64_t result[2];
    unsigned char x64arch = 1;
    unsigned char is_signed = 0;

    static char *kwlist[] = {(char *)"key", (char *)"seed", (char *)"x64arch",
                             (char *)"signed", NULL};

    if (!PyArg_ParseTupleAndKeywords(args, keywds, "s#|IBB", kwlist,
                                     &target_str, &target_str_len, &seed,
                                     &x64arch, &is_signed)) {
        return NULL;
    }

    if (x64arch == 1) {
        murmurhash3_x64_128(target_str, target_str_len, seed, result);
    }
    else {
        murmurhash3_x86_128(target_str, target_str_len, seed, result);
    }

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    result[0] = bswap_64(result[0]);
    result[1] = bswap_64(result[1]);
#endif

    /**
     * _PyLong_FromByteArray is not a part of the official Python/C API
     * and may be removed in the future (although it is practically stable).
     * cf.
     * https://mail.python.org/pipermail/python-list/2006-August/372365.html
     */
    PyObject *retval = _PyLong_FromByteArray(
        (unsigned char *)result, MMH3_128_DIGESTSIZE, 1, is_signed);

    return retval;
}

PyDoc_STRVAR(
    mmh3_hash_bytes_doc,
    "hash_bytes(key[, seed=0, x64arch=True]) -> bytes\n\n"
    "Return a 128 bit hash value as bytes for a string. Optimized for "
    "the x64 bit architecture when "
    "x64arch=True, otherwise for the x86.");

static PyObject *
mmh3_hash_bytes(PyObject *self, PyObject *args, PyObject *keywds)
{
    const char *target_str;
    Py_ssize_t target_str_len;
    uint32_t seed = 0;
    uint64_t result[2];
    unsigned char x64arch = 1;

    static char *kwlist[] = {(char *)"key", (char *)"seed", (char *)"x64arch",
                             NULL};

    if (!PyArg_ParseTupleAndKeywords(args, keywds, "s#|IB", kwlist,
                                     &target_str, &target_str_len, &seed,
                                     &x64arch)) {
        return NULL;
    }

    if (x64arch == 1) {
        murmurhash3_x64_128(target_str, target_str_len, seed, result);
    }
    else {
        murmurhash3_x86_128(target_str, target_str_len, seed, result);
    }

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    result[0] = bswap_64(result[0]);
    result[1] = bswap_64(result[1]);
#endif

    char bytes[MMH3_128_DIGESTSIZE];
    memcpy(bytes, result, MMH3_128_DIGESTSIZE);
    return PyBytes_FromStringAndSize(bytes, MMH3_128_DIGESTSIZE);
}

static PyMethodDef Mmh3Methods[] = {
    {"hash", (PyCFunction)mmh3_hash, METH_VARARGS | METH_KEYWORDS,
     mmh3_hash_doc},
    {"hash_from_buffer", (PyCFunction)mmh3_hash_from_buffer,
     METH_VARARGS | METH_KEYWORDS, mmh3_hash_from_buffer_doc},
    {"hash64", (PyCFunction)mmh3_hash64, METH_VARARGS | METH_KEYWORDS,
     mmh3_hash64_doc},
    {"hash128", (PyCFunction)mmh3_hash128, METH_VARARGS | METH_KEYWORDS,
     mmh3_hash128_doc},
    {"hash_bytes", (PyCFunction)mmh3_hash_bytes, METH_VARARGS | METH_KEYWORDS,
     mmh3_hash_bytes_doc},
    {NULL, NULL, 0, NULL}};

//-----------------------------------------------------------------------------
// Hasher classes
//
// The design of hasher classes are loosely based on the Google Guava
// implementation (Java)

//-----------------------------------------------------------------------------
// Hasher for murmurhash3_x86_32
typedef struct {
    PyObject_HEAD uint32_t h;
    uint64_t buffer;
    uint8_t shift;
    Py_ssize_t length;
} MMH3Hasher32;

static PyTypeObject MMH3Hasher32Type;

static void
MMH3Hasher32_dealloc(MMH3Hasher32 *self)
{
    Py_TYPE(self)->tp_free((PyObject *)self);
}

static PyObject *
MMH3Hasher32_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
    MMH3Hasher32 *self;
    self = (MMH3Hasher32 *)type->tp_alloc(type, 0);
    if (self != NULL) {
        self->h = 0;
        self->buffer = 0;
        self->shift = 0;
        self->length = 0;
    }
    return (PyObject *)self;
}

static int
MMH3Hasher32_init(MMH3Hasher32 *self, PyObject *args, PyObject *kwds)
{
    static char *kwlist[] = {"seed", NULL};

    if (!PyArg_ParseTupleAndKeywords(args, kwds, "|I", kwlist, &self->h))
        return -1;

    return 0;
}

static PyObject *
MMH3Hasher32_update(MMH3Hasher32 *self, PyObject *obj)
{
    Py_ssize_t i = 0;
    Py_buffer buf;
    uint32_t h1 = self->h;
    uint32_t k1 = 0;
    const uint32_t c1 = 0xe6546b64;
    const uint64_t mask = 0xffffffffUL;

    GET_BUFFER_VIEW_OR_ERROUT(obj, &buf);

    for (; i + 4 <= buf.len; i += 4) {
        k1 = getblock32(buf.buf, i / 4);
        self->buffer |= (k1 & mask) << self->shift;
        self->length += 4;

        h1 ^= mixK1(self->buffer);
        h1 = mixH1(h1, 0, 13, c1);
        self->buffer >>= 32;
    }

    for (; i < buf.len; i++) {
        k1 = ((uint8_t *)buf.buf)[i];
        self->buffer |= (k1 & mask) << self->shift;
        self->shift += 8;
        self->length += 1;

        if (self->shift >= 32) {
            h1 ^= mixK1(self->buffer);
            h1 = mixH1(h1, 0, 13, c1);
            self->buffer >>= 32;
            self->shift -= 32;
        }
    }

    PyBuffer_Release(&buf);

    self->h = h1;

    Py_RETURN_NONE;
}

static FORCE_INLINE uint32_t
digest32_impl(uint32_t h, uint64_t k1, Py_ssize_t length)
{
    h ^= mixK1(k1);
    h ^= length;
    h = fmix32(h);
    return h;
}

static PyObject *
MMH3Hasher32_digest(MMH3Hasher32 *self, PyObject *Py_UNUSED(ignored))
{
    uint32_t h = digest32_impl(self->h, self->buffer, self->length);
    char out[MMH3_32_DIGESTSIZE];

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    ((uint32_t *)out)[0] = bswap_32(h);
#else
    ((uint32_t *)out)[0] = h;
#endif

    return PyBytes_FromStringAndSize(out, MMH3_32_DIGESTSIZE);
}

static PyObject *
MMH3Hasher32_sintdigest(MMH3Hasher32 *self, PyObject *Py_UNUSED(ignored))
{
    uint32_t h = digest32_impl(self->h, self->buffer, self->length);

    // Note that simple casting ("(int32_t) h") is an undefined behavior
    int32_t result = *(int32_t *)&h;

    return PyLong_FromLong(result);
}

static PyObject *
MMH3Hasher32_uintdigest(MMH3Hasher32 *self, PyObject *Py_UNUSED(ignored))
{
    uint32_t h = digest32_impl(self->h, self->buffer, self->length);
    return PyLong_FromUnsignedLong(h);
}

static PyObject *
MMH3Hasher32_copy(MMH3Hasher32 *self, PyObject *Py_UNUSED(ignored))
{
    MMH3Hasher32 *p;

    if ((p = PyObject_New(MMH3Hasher32, &MMH3Hasher32Type)) == NULL) {
        return NULL;
    }

    p->h = self->h;
    p->buffer = self->buffer;
    p->shift = self->shift;
    p->length = self->length;

    return (PyObject *)p;
}

static PyMethodDef MMH3Hasher32_methods[] = {
    {"update", (PyCFunction)MMH3Hasher32_update, METH_O,
     "Update this hash object's state with the provided string."},
    {"digest", (PyCFunction)MMH3Hasher32_digest, METH_NOARGS,
     "Return the digest value as a bytes object."},
    {"sintdigest", (PyCFunction)MMH3Hasher32_sintdigest, METH_NOARGS,
     "Return the digest value as a 32 bit signed integer."},
    {"uintdigest", (PyCFunction)MMH3Hasher32_uintdigest, METH_NOARGS,
     "Return the digest value as a 32 bit unsigned integer."},
    {"copy", (PyCFunction)MMH3Hasher32_copy, METH_NOARGS,
     "Return a copy of the hash object."},
    {NULL} /* Sentinel */
};

static PyObject *
MMH3Hasher32_get_digest_size(PyObject *self, void *closure)
{
    return PyLong_FromLong(MMH3_32_DIGESTSIZE);
}

static PyObject *
MMH3Hasher32_get_block_size(PyObject *self, void *closure)
{
    return PyLong_FromLong(MMH3_32_BLOCKSIZE);
}

static PyObject *
MMH3Hasher32_get_name(PyObject *self, void *closure)
{
    return PyUnicode_FromStringAndSize("mmh3_32", 7);
}

static PyGetSetDef MMH3Hasher32_getsetters[] = {
    {"digest_size", (getter)MMH3Hasher32_get_digest_size, NULL, NULL, NULL},
    {"block_size", (getter)MMH3Hasher32_get_block_size, NULL, NULL, NULL},
    {"name", (getter)MMH3Hasher32_get_name, NULL, NULL, NULL},
    {NULL} /* Sentinel */
};

PyDoc_STRVAR(
    MMH3Hasher32Type_doc,
    "An mmh3_32 is an object used to calculate the murmurhash3_x86_32 hash\n"
    "of a string of information.\n"
    "\n"
    "Methods:\n"
    "\n"
    "update(input) -- updates the current digest with an additional string\n"
    "digest() -- return the current digest value\n"
    "sintdigest() -- return the current digest as a 32 bit signed integer\n"
    "uintdigest() -- return the current digest as a 32 bit unsigned integer\n"
    "copy() -- return a copy of the current object\n"
    "\n"
    "Attributes:\n"
    "\n"
    "name -- the hash algorithm being used by this object\n"
    "digest_size -- number of bytes in this hashes output\n"
    "block_size -- number of bytes of the internal block of this algorithm");

static PyTypeObject MMH3Hasher32Type = {
    PyVarObject_HEAD_INIT(NULL, 0).tp_name = "mmh3.mmh3_32",
    .tp_doc = MMH3Hasher32Type_doc,
    .tp_basicsize = sizeof(MMH3Hasher32),
    .tp_itemsize = 0,
    .tp_flags = Py_TPFLAGS_DEFAULT,
    .tp_new = MMH3Hasher32_new,
    .tp_init = (initproc)MMH3Hasher32_init,
    .tp_dealloc = (destructor)MMH3Hasher32_dealloc,
    .tp_methods = MMH3Hasher32_methods,
    .tp_getset = MMH3Hasher32_getsetters,
};

//-----------------------------------------------------------------------------
// Hasher for murmurhash3_x64_128
typedef struct {
    PyObject_HEAD uint64_t h1;
    uint64_t h2;
    uint64_t buffer1;
    uint64_t buffer2;
    uint8_t shift;
    Py_ssize_t length;
} MMH3Hasher128x64;

static PyTypeObject MMH3Hasher128x64Type;

static void
MMH3Hasher128x64_dealloc(MMH3Hasher128x64 *self)
{
    Py_TYPE(self)->tp_free((PyObject *)self);
}

static PyObject *
MMH3Hasher128x64_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
    MMH3Hasher128x64 *self;
    self = (MMH3Hasher128x64 *)type->tp_alloc(type, 0);
    if (self != NULL) {
        self->h1 = 0;
        self->h2 = 0;
        self->buffer1 = 0;
        self->buffer2 = 0;
        self->shift = 0;
        self->length = 0;
    }
    return (PyObject *)self;
}

static int
MMH3Hasher128x64_init(MMH3Hasher128x64 *self, PyObject *args, PyObject *kwds)
{
    static char *kwlist[] = {"seed", NULL};

    if (!PyArg_ParseTupleAndKeywords(args, kwds, "|K", kwlist, &self->h1))
        return -1;

    self->h2 = self->h1;

    return 0;
}

static PyObject *
MMH3Hasher128x64_update(MMH3Hasher128x64 *self, PyObject *obj)
{
    Py_ssize_t i = 0;
    Py_buffer buf;
    uint64_t h1 = self->h1;
    uint64_t h2 = self->h2;
    uint64_t k1 = 0;
    uint64_t k2 = 0;

    GET_BUFFER_VIEW_OR_ERROUT(obj, &buf);

    for (; i + 16 <= buf.len; i += 16) {
        k1 = getblock64(buf.buf, (i / 16) * 2);
        k2 = getblock64(buf.buf, (i / 16) * 2 + 1);

        if (self->shift == 0) {  // TODO: use bit ops
            self->buffer1 = k1;
            self->buffer2 = k2;
        }
        else if (self->shift < 64) {
            self->buffer1 |= k1 << self->shift;
            self->buffer2 = (k1 >> (64 - self->shift)) | (k2 << self->shift);
        }
        else if (self->shift == 64) {
            self->buffer2 = k1;
        }
        else {
            self->buffer2 |= k1 << (self->shift - 64);
        }

        h1 ^= mixK1_x64_128(self->buffer1);
        h1 = mixH_x64_128(h1, h2, 27, 0x52dce729UL);
        h2 ^= mixK2_x64_128(self->buffer2);
        h2 = mixH_x64_128(h2, h1, 31, 0x38495ab5UL);

        self->length += 16;
        if (self->shift == 0) {  // TODO: use bit ops
            self->buffer1 = 0;
            self->buffer2 = 0;
        }
        else if (self->shift < 64) {
            self->buffer1 = k2 >> (64 - self->shift);
            self->buffer2 = 0;
        }
        else if (self->shift == 64) {
            self->buffer1 = k2;
            self->buffer2 = 0;
        }
        else {
            self->buffer1 =
                k1 >> (128 - self->shift) | (k2 << (self->shift - 64));
            self->buffer2 = k2 >> (128 - self->shift);
        }
    }

    for (; i < buf.len; i++) {
        k1 = ((uint8_t *)buf.buf)[i];
        if (self->shift < 64) {  // TODO: use bit ops
            self->buffer1 |= k1 << self->shift;
        }
        else {
            self->buffer2 |= k1 << (self->shift - 64);
        }
        self->shift += 8;
        self->length += 1;

        if (self->shift >= 128) {
            h1 ^= mixK1_x64_128(self->buffer1);
            h1 = mixH_x64_128(h1, h2, 27, 0x52dce729UL);
            h2 ^= mixK2_x64_128(self->buffer2);
            h2 = mixH_x64_128(h2, h1, 31, 0x38495ab5UL);

            self->buffer1 = 0;
            self->buffer2 = 0;
            self->shift -= 128;
        }
    }

    PyBuffer_Release(&buf);

    self->h1 = h1;
    self->h2 = h2;

    Py_RETURN_NONE;
}

static PyObject *
MMH3Hasher128x64_digest(MMH3Hasher128x64 *self, PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x64_128_impl(self->h1, self->h2, self->buffer1, self->buffer2,
                        self->length, out);
    return PyBytes_FromStringAndSize(out, MMH3_128_DIGESTSIZE);
}

static PyObject *
MMH3Hasher128x64_sintdigest(MMH3Hasher128x64 *self,
                            PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x64_128_impl(self->h1, self->h2, self->buffer1, self->buffer2,
                        self->length, out);
    const int little_endian = 1;
    const int is_signed = 1;

    /**
     * _PyLong_FromByteArray is not a part of the official Python/C API
     * and may be removed in the future (although it is practically stable).
     * cf.
     * https://mail.python.org/pipermail/python-list/2006-August/372365.html
     */
    PyObject *retval = _PyLong_FromByteArray(
        (unsigned char *)out, MMH3_128_DIGESTSIZE, little_endian, is_signed);

    return retval;
}

static PyObject *
MMH3Hasher128x64_uintdigest(MMH3Hasher128x64 *self,
                            PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x64_128_impl(self->h1, self->h2, self->buffer1, self->buffer2,
                        self->length, out);
    const int little_endian = 1;
    const int is_signed = 0;

    /**
     * _PyLong_FromByteArray is not a part of the official Python/C API
     * and may be removed in the future (although it is practically stable).
     * cf.
     * https://mail.python.org/pipermail/python-list/2006-August/372365.html
     */
    PyObject *retval = _PyLong_FromByteArray(
        (unsigned char *)out, MMH3_128_DIGESTSIZE, little_endian, is_signed);

    return retval;
}

static PyObject *
MMH3Hasher128x64_stupledigest(MMH3Hasher128x64 *self,
                              PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x64_128_impl(self->h1, self->h2, self->buffer1, self->buffer2,
                        self->length, out);

    const char *valflag = "LL";
    uint64_t result1 = ((uint64_t *)out)[0];
    uint64_t result2 = ((uint64_t *)out)[1];

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    result1 = bswap_64(result1);
    result2 = bswap_64(result2);
#endif

    return Py_BuildValue(valflag, result1, result2);
}

static PyObject *
MMH3Hasher128x64_utupledigest(MMH3Hasher128x64 *self,
                              PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x64_128_impl(self->h1, self->h2, self->buffer1, self->buffer2,
                        self->length, out);

    const char *valflag = "KK";
    uint64_t result1 = ((uint64_t *)out)[0];
    uint64_t result2 = ((uint64_t *)out)[1];

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    result1 = bswap_64(result1);
    result2 = bswap_64(result2);
#endif

    return Py_BuildValue(valflag, result1, result2);
}

static PyObject *
MMH3Hasher128x64_copy(MMH3Hasher128x64 *self, PyObject *Py_UNUSED(ignored))
{
    MMH3Hasher128x64 *p;

    if ((p = PyObject_New(MMH3Hasher128x64, &MMH3Hasher128x64Type)) == NULL) {
        return NULL;
    }

    p->h1 = self->h1;
    p->h2 = self->h2;
    p->buffer1 = self->buffer1;
    p->buffer2 = self->buffer2;
    p->shift = self->shift;
    p->length = self->length;

    return (PyObject *)p;
}

static PyMethodDef MMH3Hasher128x64_methods[] = {
    {"update", (PyCFunction)MMH3Hasher128x64_update, METH_O,
     "Update this hash object's state with the provided string."},
    {"digest", (PyCFunction)MMH3Hasher128x64_digest, METH_NOARGS,
     "Return the digest value as a bytes object."},
    {"sintdigest", (PyCFunction)MMH3Hasher128x64_sintdigest, METH_NOARGS,
     "Return the digest value as a 128 bit signed integer."},
    {"uintdigest", (PyCFunction)MMH3Hasher128x64_uintdigest, METH_NOARGS,
     "Return the digest value as a 128 bit unsigned integer."},
    {"stupledigest", (PyCFunction)MMH3Hasher128x64_stupledigest, METH_NOARGS,
     "Return the digest value as a tuple of two 64 bit signed integers."},
    {"utupledigest", (PyCFunction)MMH3Hasher128x64_utupledigest, METH_NOARGS,
     "Return the digest value as a tuple of two 64 bit unsigned integers."},
    {"copy", (PyCFunction)MMH3Hasher128x64_copy, METH_NOARGS,
     "Return a copy of the hash object."},
    {NULL} /* Sentinel */
};

static PyObject *
MMH3Hasher128x64_get_digest_size(PyObject *self, void *closure)
{
    return PyLong_FromLong(MMH3_128_DIGESTSIZE);
}

static PyObject *
MMH3Hasher128x64_get_block_size(PyObject *self, void *closure)
{
    return PyLong_FromLong(MMH3_128_BLOCKSIZE);
}

static PyObject *
MMH3Hasher128x64_get_name(PyObject *self, void *closure)
{
    return PyUnicode_FromStringAndSize("mmh3_x64_128", 12);
}

static PyGetSetDef MMH3Hasher128x64_getsetters[] = {
    {"digest_size", (getter)MMH3Hasher128x64_get_digest_size, NULL, NULL,
     NULL},
    {"block_size", (getter)MMH3Hasher128x64_get_block_size, NULL, NULL, NULL},
    {"name", (getter)MMH3Hasher128x64_get_name, NULL, NULL, NULL},
    {NULL} /* Sentinel */
};

PyDoc_STRVAR(
    MMH3Hasher128x64Type_doc,
    "An mmh3_x64_128 is an object used to calculate the murmurhash3_x64_128\n"
    "hash of a string of information.\n"
    "\n"
    "Methods:\n"
    "\n"
    "update(input) -- updates the current digest with an additional string\n"
    "digest() -- return the current digest value\n"
    "sintdigest() -- return the current digest as a 128 bit signed integer\n"
    "uintdigest() -- return the current digest as a 128 bit unsigned integer\n"
    "stupledigest() -- return the current digest as a tuple of two 64 bit\n"
    "                  signed integers\n"
    "utupledigest() -- return the current digest as a tuple of two 64 bit\n"
    "                  unsigned integers\n"
    "copy() -- return a copy of the current object\n"
    "\n"
    "Attributes:\n"
    "\n"
    "name -- the hash algorithm being used by this object\n"
    "digest_size -- number of bytes in this hashes output\n"
    "block_size -- number of bytes of the internal block of this algorithm");

static PyTypeObject MMH3Hasher128x64Type = {
    PyVarObject_HEAD_INIT(NULL, 0).tp_name = "mmh3.mmh3_x64_128",
    .tp_doc = MMH3Hasher128x64Type_doc,
    .tp_basicsize = sizeof(MMH3Hasher128x64),
    .tp_itemsize = 0,
    .tp_flags = Py_TPFLAGS_DEFAULT,
    .tp_new = MMH3Hasher128x64_new,
    .tp_init = (initproc)MMH3Hasher128x64_init,
    .tp_dealloc = (destructor)MMH3Hasher128x64_dealloc,
    .tp_methods = MMH3Hasher128x64_methods,
    .tp_getset = MMH3Hasher128x64_getsetters,
};

//-----------------------------------------------------------------------------
// Hasher for murmurhash3_x86_128
typedef struct {
    PyObject_HEAD uint32_t h1;
    uint32_t h2;
    uint32_t h3;
    uint32_t h4;
    uint32_t buffer1;
    uint32_t buffer2;
    uint32_t buffer3;
    uint32_t buffer4;
    uint8_t shift;
    Py_ssize_t length;
} MMH3Hasher128x86;

static PyTypeObject MMH3Hasher128x86Type;

static void
MMH3Hasher128x86_dealloc(MMH3Hasher128x86 *self)
{
    Py_TYPE(self)->tp_free((PyObject *)self);
}

static PyObject *
MMH3Hasher128x86_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
    MMH3Hasher128x86 *self;
    self = (MMH3Hasher128x86 *)type->tp_alloc(type, 0);
    if (self != NULL) {
        self->h1 = 0;
        self->h2 = 0;
        self->h3 = 0;
        self->h4 = 0;
        self->buffer1 = 0;
        self->buffer2 = 0;
        self->buffer3 = 0;
        self->buffer4 = 0;
        self->shift = 0;
        self->length = 0;
    }
    return (PyObject *)self;
}

static int
MMH3Hasher128x86_init(MMH3Hasher128x86 *self, PyObject *args, PyObject *kwds)
{
    static char *kwlist[] = {"seed", NULL};

    if (!PyArg_ParseTupleAndKeywords(args, kwds, "|I", kwlist, &self->h1))
        return -1;

    self->h2 = self->h1;
    self->h3 = self->h1;
    self->h4 = self->h1;

    return 0;
}

static PyObject *
MMH3Hasher128x86_update(MMH3Hasher128x86 *self, PyObject *obj)
{
    Py_ssize_t i = 0;
    Py_buffer buf;
    uint32_t h1 = self->h1;
    uint32_t h2 = self->h2;
    uint32_t h3 = self->h3;
    uint32_t h4 = self->h4;
    uint32_t k1 = 0;

    GET_BUFFER_VIEW_OR_ERROUT(obj, &buf);

    for (; i < buf.len; i++) {
        k1 = ((uint8_t *)buf.buf)[i];
        if (self->shift < 32) {  // TODO: use bit ops
            self->buffer1 |= k1 << self->shift;
        }
        else if (self->shift < 64) {
            self->buffer2 |= k1 << (self->shift - 32);
        }
        else if (self->shift < 96) {
            self->buffer3 |= k1 << (self->shift - 64);
        }
        else {
            self->buffer4 |= k1 << (self->shift - 96);
        }
        self->shift += 8;
        self->length += 1;

        if (self->shift >= 128) {
            const uint32_t c1 = 0x239b961b;
            const uint32_t c2 = 0xab0e9789;
            const uint32_t c3 = 0x38b34ae5;
            const uint32_t c4 = 0xa1e38b93;

            h1 ^= mixK_x86_128(self->buffer1, 15, c1, c2);
            h1 = mixH1(h1, h2, 19, 0x561ccd1bUL);

            h2 ^= mixK_x86_128(self->buffer2, 16, c2, c3);
            h2 = mixH1(h2, h3, 17, 0x0bcaa747UL);

            h3 ^= mixK_x86_128(self->buffer3, 17, c3, c4);
            h3 = mixH1(h3, h4, 15, 0x96cd1c35UL);

            h4 ^= mixK_x86_128(self->buffer4, 18, c4, c1);
            h4 = mixH1(h4, h1, 13, 0x32ac3b17UL);

            self->buffer1 = 0;
            self->buffer2 = 0;
            self->buffer3 = 0;
            self->buffer4 = 0;
            self->shift -= 128;
        }
    }

    PyBuffer_Release(&buf);

    self->h1 = h1;
    self->h2 = h2;
    self->h3 = h3;
    self->h4 = h4;

    Py_RETURN_NONE;
}

static PyObject *
MMH3Hasher128x86_digest(MMH3Hasher128x86 *self, PyObject *Py_UNUSED(ignored))
{
    char out[MMH3_128_DIGESTSIZE];
    digest_x86_128_impl(self->h1, self->h2, self->h3, self->h4, self->buffer1,
                        self->buffer2, self->buffer3, self->buffer4,
                        self->length, out);
    return PyBytes_FromStringAndSize(out, MMH3_128_DIGESTSIZE);
}

static PyObject *
MMH3Hasher128x86_sintdigest(MMH3Hasher128x86 *self,
                            PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x86_128_impl(self->h1, self->h2, self->h3, self->h4, self->buffer1,
                        self->buffer2, self->buffer3, self->buffer4,
                        self->length, out);
    const int little_endian = 1;
    const int is_signed = 1;

    /**
     * _PyLong_FromByteArray is not a part of the official Python/C API
     * and may be removed in the future (although it is practically stable).
     * cf.
     * https://mail.python.org/pipermail/python-list/2006-August/372365.html
     */
    PyObject *retval = _PyLong_FromByteArray(
        (unsigned char *)out, MMH3_128_DIGESTSIZE, little_endian, is_signed);

    return retval;
}

static PyObject *
MMH3Hasher128x86_uintdigest(MMH3Hasher128x86 *self,
                            PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x86_128_impl(self->h1, self->h2, self->h3, self->h4, self->buffer1,
                        self->buffer2, self->buffer3, self->buffer4,
                        self->length, out);
    const int little_endian = 1;
    const int is_signed = 0;

    /**
     * _PyLong_FromByteArray is not a part of the official Python/C API
     * and may be removed in the future (although it is practically stable).
     * cf.
     * https://mail.python.org/pipermail/python-list/2006-August/372365.html
     */
    PyObject *retval = _PyLong_FromByteArray(
        (unsigned char *)out, MMH3_128_DIGESTSIZE, little_endian, is_signed);

    return retval;
}

static PyObject *
MMH3Hasher128x86_stupledigest(MMH3Hasher128x86 *self,
                              PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x86_128_impl(self->h1, self->h2, self->h3, self->h4, self->buffer1,
                        self->buffer2, self->buffer3, self->buffer4,
                        self->length, out);

    const char *valflag = "LL";
    uint64_t result1 = ((uint64_t *)out)[0];
    uint64_t result2 = ((uint64_t *)out)[1];

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    result1 = bswap_64(result1);
    result2 = bswap_64(result2);
#endif

    return Py_BuildValue(valflag, result1, result2);
}

static PyObject *
MMH3Hasher128x86_utupledigest(MMH3Hasher128x86 *self,
                              PyObject *Py_UNUSED(ignored))
{
    const char out[MMH3_128_DIGESTSIZE];
    digest_x86_128_impl(self->h1, self->h2, self->h3, self->h4, self->buffer1,
                        self->buffer2, self->buffer3, self->buffer4,
                        self->length, out);

    const char *valflag = "KK";
    uint64_t result1 = ((uint64_t *)out)[0];
    uint64_t result2 = ((uint64_t *)out)[1];

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ == __ORDER_BIG_ENDIAN__)
    result1 = bswap_64(result1);
    result2 = bswap_64(result2);
#endif

    return Py_BuildValue(valflag, result1, result2);
}

static PyObject *
MMH3Hasher128x86_copy(MMH3Hasher128x86 *self, PyObject *Py_UNUSED(ignored))
{
    MMH3Hasher128x86 *p;

    if ((p = PyObject_New(MMH3Hasher128x86, &MMH3Hasher128x86Type)) == NULL) {
        return NULL;
    }

    p->h1 = self->h1;
    p->h2 = self->h2;
    p->h3 = self->h3;
    p->h4 = self->h4;
    p->buffer1 = self->buffer1;
    p->buffer2 = self->buffer2;
    p->buffer3 = self->buffer3;
    p->buffer4 = self->buffer4;
    p->shift = self->shift;
    p->length = self->length;

    return (PyObject *)p;
}

static PyMethodDef MMH3Hasher128x86_methods[] = {
    {"update", (PyCFunction)MMH3Hasher128x86_update, METH_O,
     "Update this hash object's state with the provided string."},
    {"digest", (PyCFunction)MMH3Hasher128x86_digest, METH_NOARGS,
     "Return the digest value as a bytes object."},
    {"sintdigest", (PyCFunction)MMH3Hasher128x86_sintdigest, METH_NOARGS,
     "Return the digest value as a 128 bit signed integer."},
    {"uintdigest", (PyCFunction)MMH3Hasher128x86_uintdigest, METH_NOARGS,
     "Return the digest value as a 128 bit unsigned integer."},
    {"stupledigest", (PyCFunction)MMH3Hasher128x86_stupledigest, METH_NOARGS,
     "Return the digest value as a tuple of two 64 bit signed integers."},
    {"utupledigest", (PyCFunction)MMH3Hasher128x86_utupledigest, METH_NOARGS,
     "Return the digest value as a tuple of two 64 bit unsigned integers."},
    {"copy", (PyCFunction)MMH3Hasher128x86_copy, METH_NOARGS,
     "Return a copy of the hash object."},
    {NULL} /* Sentinel */
};

static PyObject *
MMH3Hasher128x86_get_digest_size(PyObject *self, void *closure)
{
    return PyLong_FromLong(MMH3_128_DIGESTSIZE);
}

static PyObject *
MMH3Hasher128x86_get_block_size(PyObject *self, void *closure)
{
    return PyLong_FromLong(MMH3_128_BLOCKSIZE);
}

static PyObject *
MMH3Hasher128x86_get_name(PyObject *self, void *closure)
{
    return PyUnicode_FromStringAndSize("mmh3_x86_128", 12);
}

static PyGetSetDef MMH3Hasher128x86_getsetters[] = {
    {"digest_size", (getter)MMH3Hasher128x86_get_digest_size, NULL, NULL,
     NULL},
    {"block_size", (getter)MMH3Hasher128x86_get_block_size, NULL, NULL, NULL},
    {"name", (getter)MMH3Hasher128x86_get_name, NULL, NULL, NULL},
    {NULL} /* Sentinel */
};

PyDoc_STRVAR(
    MMH3Hasher128x86Type_doc,
    "An mmh3_x86_128 is an object used to calculate the murmurhash3_x86_128\n"
    "hash of a string of information.\n"
    "\n"
    "Methods:\n"
    "\n"
    "update(input) -- updates the current digest with an additional string\n"
    "digest() -- return the current digest value\n"
    "sintdigest() -- return the current digest as a 128 bit signed integer\n"
    "uintdigest() -- return the current digest as a 128 bit unsigned integer\n"
    "stupledigest() -- return the current digest as a tuple of two 64 bit\n"
    "                  signed integers\n"
    "utupledigest() -- return the current digest as a tuple of two 64 bit\n"
    "                  unsigned integers\n"
    "copy() -- return a copy of the current object\n"
    "\n"
    "Attributes:\n"
    "\n"
    "name -- the hash algorithm being used by this object\n"
    "digest_size -- number of bytes in this hashes output\n"
    "block_size -- number of bytes of the internal block of this algorithm");

static PyTypeObject MMH3Hasher128x86Type = {
    PyVarObject_HEAD_INIT(NULL, 0).tp_name = "mmh3.mmh3_x86_128",
    .tp_doc = MMH3Hasher128x86Type_doc,
    .tp_basicsize = sizeof(MMH3Hasher128x86),
    .tp_itemsize = 0,
    .tp_flags = Py_TPFLAGS_DEFAULT,
    .tp_new = MMH3Hasher128x86_new,
    .tp_init = (initproc)MMH3Hasher128x86_init,
    .tp_dealloc = (destructor)MMH3Hasher128x86_dealloc,
    .tp_methods = MMH3Hasher128x86_methods,
    .tp_getset = MMH3Hasher128x86_getsetters,
};

//-----------------------------------------------------------------------------
// Module
static struct PyModuleDef mmh3module = {
    PyModuleDef_HEAD_INIT,
    "mmh3",
    "mmh3 is a Python front-end to MurmurHash3, "
    "a fast and robust hash library "
    "created by Austin Appleby (http://code.google.com/p/smhasher/).\n "
    "Ported by Hajime Senuma <hajime.senuma@gmail.com>\n"
    "Try hash('foobar') or hash('foobar', 1984).\n"
    "If you find any bugs, please submit an issue via "
    "https://github.com/hajimes/mmh3",
    -1,
    Mmh3Methods,
    NULL,
    NULL,
    NULL,
    NULL};

PyMODINIT_FUNC
PyInit_mmh3(void)
{
    if (PyType_Ready(&MMH3Hasher32Type) < 0)
        return NULL;

    if (PyType_Ready(&MMH3Hasher128x64Type) < 0)
        return NULL;

    if (PyType_Ready(&MMH3Hasher128x86Type) < 0)
        return NULL;

    PyObject *module = PyModule_Create(&mmh3module);

    if (module == NULL)
        return NULL;

    Py_INCREF(&MMH3Hasher32Type);
    if (PyModule_AddObject(module, "mmh3_32", (PyObject *)&MMH3Hasher32Type) <
        0) {
        Py_DECREF(&MMH3Hasher32Type);
        Py_DECREF(module);
        return NULL;
    }

    Py_INCREF(&MMH3Hasher128x64Type);
    if (PyModule_AddObject(module, "mmh3_x64_128",
                           (PyObject *)&MMH3Hasher128x64Type) < 0) {
        Py_DECREF(&MMH3Hasher128x64Type);
        Py_DECREF(module);
        return NULL;
    }

    Py_INCREF(&MMH3Hasher128x86Type);
    if (PyModule_AddObject(module, "mmh3_x86_128",
                           (PyObject *)&MMH3Hasher128x86Type) < 0) {
        Py_DECREF(&MMH3Hasher128x86Type);
        Py_DECREF(module);
        return NULL;
    }

    return module;
}