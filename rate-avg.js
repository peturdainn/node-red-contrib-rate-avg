/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2021 @peturdainn (petur@lunda.be)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 **/

// rate-limitter (time or count) with average and rounding

module.exports = function(RED)
{
    "use strict";

    function RateAVG(config)
    {
        RED.nodes.createNode(this,config);

    	this.name = config.name;
        this.buffer = [];
        this.timeunits = config.timeunits;
        this.intervalID = -1;
        this.windowtype = config.windowtype;
        this.count = config.countwindow;
        this.round = Number(config.round);
        if((this.round < 0) || (this.round > 3))
        {
            this.round = 0;
        }
        this.timewindow = config.timewindow; // default ms
        if(config.timeunits == 'seconds') 
        {
            this.timewindow = config.timewindow * 1000;
        }
        else if(config.timeunits == 'minutes') 
        {
            this.timewindow = config.timewindow * 60 * 1000;
        }
        else if(config.timeunits == 'hours') 
        {
            this.timewindow = config.timewindow * 60 * 60 * 1000;
        }
        else if(config.timeunits == 'days') 
        {
            this.timewindow = config.timewindow * 24 * 60 * 60 * 1000;
        }

        var node = this;

        if(node.windowtype == 'time')
        {
            // time based ratelimit
            node.intervalID = setInterval(function() {  calculate_average(node.buffer.slice(0));
                                                        node.buffer = [];
                                                        node.status( { fill: 'green', shape: 'dot', text: node.buffer.length } );
                                                     },node.timewindow);    
        }

        node.on("input", function(msg) 
        {
            var value = parseFloat(msg.payload);
            if(NaN != value)
            {
                // we only deal with numbers and we already filter when pushing in...
                msg.topic = msg.topic || '_none_';
                msg.pushedAt = new Date().getTime();
                var topic = node.buffer.find(b => typeof(b[0]) == 'object' && b.find(b2 => b2.topic == msg.topic));
                var len = 0;
                if(!topic) 
                {
                    node.buffer.push([msg]);
                    len = node.buffer.length;
                    node.status( {fill: 'grey', shape: 'dot', text: len } );
                }
                else
                {
                    topic.push(msg);
                    len = topic.length;
                    if(node.windowtype == 'count' && topic.length >= node.count)
                    {
                        // count based ratelimit
                        calculate_average(node.buffer.slice(0));
                        node.buffer = [];
                        node.status( { fill: 'green', shape: 'dot', text: node.buffer.length } );
                    }
                    else
                    {
                        node.status( {fill: 'grey', shape: 'dot', text: len } );
                    }
                }
            }
            else
            {
                node.status( {fill: 'red', shape: 'dot', text: "NaN" } );
            }
        });

        node.on("close", function() {
            clearInterval(node.intervalID);
            node.buffer = [];
            node.status({});
        });

        function calculate_average(topics)
        {
            while (topics.length > 0) 
            {
                let topic = topics.shift();
                var err = topic.filter(m => isNaN(m.payload));
                if (err.length == 0)
                {
                    let result = topic[topic.length-1];
                    var values = topic.map(p => (p.payload)); // create array of payloads
                    var calculated_average;
                    if(values.length > 0)
                    {
                         calculated_average = values.reduce((a,b) => parseFloat(a) + parseFloat(b)) / values.length;
                    }
                    else
                    {
                        calculated_average = parseFloat(values[0]);
                    }
                    //getCalculation(topic, topic[0].pushedAt, result.pushedAt);
                    result.payload = parseFloat(calculated_average.toFixed(node.round));
                    node.send(result);
                } 
                else 
                {
                    node.error('Topic removed, non numerical value found.', err[0]);
                }
            }
        }

//        function getCalculation(messages, firstAt, lastAt)
//        {
//            return values.length == 0 ? parseFloat(values[0]) : (values.reduce((a,b) => parseFloat(a) + parseFloat(b)) / values.length);
//        }
    }

    RED.nodes.registerType("rate-avg",RateAVG);
}
