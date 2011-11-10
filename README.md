Dropshare
===

Dropshare is a shameless [ge.tt](http://ge.tt) / [min.us](http://min.us) clone.

This contains both a server and clients (curl and browser)
Dropshare-server is the server for a simple ge.tt or min.us clone.

Install
===

  0. Install `redis`. See Appendix (below) for installing redis on OS X.

LICENSE
===

Dropshare is available under the following lincenses:

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
