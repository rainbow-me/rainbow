#!/bin/bash
DEBUGFILE=src/config/debug.js
if test -f "$DEBUGFILE"; then
    echo "$DEBUGFILE exists."
else
    echo "$DEBUGFILE does not exist. You use default debug settings."
    cp src/config/defaultDebug.js $FILE
fi
