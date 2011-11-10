#! /bin/bash

# npm install -g json-cherry-pick

HOST="http://localhost:3700"

RESULT=`curl "${HOST}/files/new"  -X POST \
  -H "Content-Type: application/json" \
  -d '[{
        "size": 35,
        "lastModifiedDate": "2011-11-08T00:15:06.000Z",
        "fileName": "foobar.txt",
        "type": "text/plain; charset=utf-8"
      }]'`

echo $RESULT
ID=`echo ${RESULT} | json-cherry-pick 0`

curl "${HOST}/files"  -X POST \
  --form ${ID}=@foobar.txt

curl "${HOST}/files/${ID}/test.txt" -X GET

# Test with a bogus id
curl "${HOST}/files"  -X POST \
  --form SVEN=@foobar.txt


curl "${HOST}/files/SVEN/test.txt" -X GET

curl "${HOST}/files/a_bogus_id/test.txt" -X GET
