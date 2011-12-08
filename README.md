Dropshare
===

[DropShare](http://dropsha.re) is a shameless [ge.tt](http://ge.tt) / [min.us](http://min.us) clone. [droplr](http://droplr.com) is also similar.

Clients
===

A few different clients are avaible.

Web
---

With the web-client you can drag-n-drop or use the normal upload/download.

    [http://dropsha.re](http://dropsha.re)

Bash
---

**Usage**

    dropshare /path/to/file.ext
    
    # Example - share your public ssh key with someone
    dropshare ~/.ssh/id_rsa.pub
    
**Example Output**

    Your file, Sir! (or Ma'am):
    
    http://dropsha.re/#foHsCQA
    
    wget 'http://api.dropsha.re/files/foHsCQA/coolaj86@ubuntu-tablet.pub'
    
    curl 'http://api.dropsha.re/files/foHsCQA' -o 'coolaj86@ubuntu-tablet.pub'

**Installation**

    sudo wget 'https://raw.github.com/coolaj86/dropshare/master/clients/dropshare.sh' -O '/usr/local/bin/dropshare'
    sudo chmod a+x '/usr/local/bin/dropshare'

Server
===

If you're interested in consulting or setup to run DropShare on your private network
at your Home Office, or Business please contact <coolaj86@gmail.com>.

Quick Start for Running your own DropShare
---

  0. Install `redis`. See Appendix (below) for installing redis on OS X.
  0. Install [Spark](https://github.com/senchalabs/spark) with `npm install -g spark`.
  0. Copy `config.default.js` to `config.js`, and customize any server
     settings you would like.
  0. Run `cd public; ./deploy.sh` to compile the static assets.
  0. Start the server with `spark`. By default it runs on port 3700.

Running Tests
---

Run the tests with:

    cd tests
    ./test.sh

The tests depend on being in the same directory as the test script, due
to paths to resources and such.


LICENSE
===

Dropshare is available under the following licenses:

  * MIT
  * Apache 2

Appendix
===

Installing Redis
---

    brew install redis

    mkdir -p ~/Library/LaunchAgents

    launchctl unload -w ~/Library/LaunchAgents/io.redis.redis-server.plist 2>/dev/null || true
    cp /usr/local/Cellar/redis/2.2.12/io.redis.redis-server.plist ~/Library/LaunchAgents/
    launchctl load -w ~/Library/LaunchAgents/io.redis.redis-server.plist

**To start redis manually:**

    redis-server /usr/local/etc/redis.conf

**To access the server:**
    redis-cli

Ubuntu Linux
---

    sudo apt-get install redis
