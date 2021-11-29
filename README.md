# node-red-contrib-rate-avg

## What?
A Node-Red (http://nodered.org) node that offers a rate limiter that produces averages and offers configurable rounding

## Why?
I looked everywhere for this functionality, the closest I came was node-red-contrib-calculate (https://github.com/obrut/node-red-contrib-calculate) by Gustaf Ridderstolpe. Sadly he didn't want to add the rounding code I offered, opting to keep things simple, so I created my own. I borrowed some ideas and mechanisms from him. If you don't need rounding but do need median and min/max calculation, have a look at his node!

## Getting started
To install, search for this module in the pallete, or execute:
    npm install node-red-contrib-rate-avg
Then, add the node and edit its settings: select rate type (time or msg count), specify time or number of msg, and pick a rounding.
The info dot in the flow shows grey with a number of messages currently queued, or green when an average calculation was sent out.

