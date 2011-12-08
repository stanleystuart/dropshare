#!/bin/bash

#
# Installation
#
# sudo wget https://raw.github.com/coolaj86/dropshare/master/clients/dropshare.sh -o /usr/local/bin/dropshare
# sudo chmod a+x /usr/local/bin/dropshare
#

HOST="http://api.dropsha.re"

FILE=$1
if [ ! -f "${FILE}" ]
then
  echo "'${FILE}' is not a file"
  echo Usage: dropshare /path/to/file
  exit 1
fi

# works on OSX and Linux
# TODO write in python (available on most *nix?)
FILE_SIZE=`du "${FILE}" | cut -f1`
# from the commandline, only half of these slashes are necessary
FILE_NAME=`basename "${FILE}" | sed 's/\\\\/\\\\\\\\/g' | sed 's/"/\\\\"/g'`
if [ -z "${FILE_PATH}" ]
then
  FILE_PATH=`dirname "${FILE}" | sed 's/\\\\/\\\\\\\\/g' | sed 's/"/\\\\"/g'`
  # cmdline: FILE_PATH=`dirname "${FILE}" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g'`
else
  FILE_PATH=''
fi
FILE_TYPE=`file --brief --mime-type "${FILE}"`
FILE_MTIME=`stat --printf '%Y\n' "${FILE}" 2>/dev/null || stat -f '%m' "${FILE}"`
FILE_MTIME=`date -d "@${FILE_MTIME}" -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -r "${FILE_MTIME}" +"%Y-%m-%dT%H:%M:%SZ"`

#echo '[{
RESULT=`curl --silent "${HOST}/files/new"  -X POST \
  -H "Content-Type: application/json" \
  -d '[{
        "size": '${FILE_SIZE}',
        "lastModifiedDate": "'${FILE_MTIME}'",
        "fileName": "'${FILE_NAME}'",
        "path": "'${FILE_PATH}'",
        "type": "'${FILE_TYPE}'"
      }]'`

# ex: ["p2Oo6f8"]
ID=`echo ${RESULT} | cut -d'"' -f2`

# TODO 
RESPONSE=`curl --silent --progress-bar "${HOST}/files"  -X POST \
  --form ${ID}=@"${FILE}"`
echo ""

# http://api.dropsha.re/files/dx.R6f8/removefriend.php.har
echo "Your file, Sir! (or Ma'am):"
echo ""
echo "http://dropsha.re/#${ID}"
echo ""
echo "wget http://api.dropsha.re/files/${ID}/${FILE_NAME}"
echo ""
echo "curl http://api.dropsha.re/files/${ID} -O ${FILE_NAME}"
echo ""
echo "dropshare-get ${ID}"
