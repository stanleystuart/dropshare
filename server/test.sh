#! /bin/bash

HOST="http://localhost:3333"

curl "${HOST}/files/new"  -X POST \
  -H "Content-Type: application/json" \
  -d '[{
        "size": 35,
        "lastModifiedDate": "2011-11-08T00:15:06.000Z",
        "fileName": "foobar.txt",
        "type": "text/plain"
      }]'

# curl "${HOST}/files"  -X POST \
#   -H "Content-Type: application/json" \
#   -d '{
#         "id": "41767754"
#       }' \
#   --form upload=@foobar.txt
