#!/bin/bash
echo '{ "foo": "bar", "baz": ["quux", "qux"], "corge": "grault" }' | node json-cherrypick.js foo
echo '{ "foo": "bar", "baz": ["quux", "qux"], "corge": "grault" }' | node json-cherrypick.js baz.1
echo '{ "foo": "bar", "baz": ["quux", "qux"], "corge": { "grault": "garply" } }' | node json-cherrypick.js corge.grault
