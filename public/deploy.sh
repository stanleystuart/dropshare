#!/bin/bash
lessc style.less > style.css
jade index.jade # index.html
pakmanager build
