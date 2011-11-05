#!/bin/bash
JSON=`curl http://localhost:4567/file/new`
TOKEN=`echo ${JSON} | ./json-cherrypick.js token`
SECRET=`echo ${JSON} | ./json-cherrypick.js secret`

curl http://localhost:4567/file/${TOKEN} \
  -X POST \
  -H 'Content-Type: image/png' \
  -d @smiley.png

curl http://localhost:4567/file/${TOKEN} \
  -X PUT \
  -H 'X-Secret:' ${SECRET}
  -H 'Content-Type: application/json' \
  -d '{
          "title": "Smiles More"
      }'

curl http://localhost:4567/file/${TOKEN}/smiley.png
# TODO should default to smiley.png and the extra slash should be an override
