
var SVG_NS = "http://www.w3.org/2000/svg"
var VERTEX_R = 10;
var LINE_W = 2;
var LINE_WB = 8;

var mode = "v";

var dragActive = false;
var dragIgnoreMouseUp = false;
var activeVertex = null;

var display, displayCont, statusLine, verticesGroup, verticesMask, edgesGroup;

var graph = new Graph();

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function List(values) {
    if(values) {
        this.data = new Array(values);
    } else {
        this.data = new Array();
    }

    this.getSize = function() {
        return this.data.length;
    }
    
    this.remove = function(item) {
        var index = this.data.indexOf(item);
        if(index == -1) {
            return false;
        }

        this.data.splice(index, 1);
        return true;
    }

    this.removeAt = function(i) {
        this.data.splice(i, 1);
    }

    this.append = function(item) {
        this.data.push(item);
    }

    this.push = function(item) {
        this.data.unshift(item);
    }

    this.pop = function() {
        return this.data.shift();
    }

    this.get = function(i) {
        return this.data[i];
    }

    this.set = function(i, item) {
        this.data[i] = item;
    }

    this.exists = function(item) {
        return (this.data.indexOf(item) != -1);
    }

    this.forEach = function(f) {
        var cp = this.data.slice(0);
        for(var i = 0; i < cp.length; i++) {
            f(cp[i]);
        }
    }

    this.map = function(f) {
        var r = [];
        for(var i = 0; i < this.getSize(); i++) {
            r.push(f(this.get(i)));
        }

        return new List(r);
    }

    this.clone = function() {
        return new List(this.data.slice(0));
    }
}

function Vertex(graph) {
    this.graph = graph; 

    this.el_group = document.createElementNS(SVG_NS, "g");
    this.el_cir = document.createElementNS(SVG_NS, "circle");
    this.el_mask = document.createElementNS(SVG_NS, "circle");
    this.el_label = document.createElementNS(SVG_NS, "text");

    this.el_group.vertex = this;
    this.el_cir.vertex = this;
    this.el_mask.vertex = this;
    this.el_label.vertex = this;

    this.el_group.appendChild(this.el_cir);
    this.el_group.appendChild(this.el_label);

    this.el_cir.setAttributeNS(null, "r", VERTEX_R);
    this.el_cir.setAttributeNS(null, "fill", "#0000ff");
    this.el_cir.setAttributeNS(null, "fill-opacity", 0.5);


    this.el_mask.setAttributeNS(null, "r", VERTEX_R);
    this.el_mask.setAttributeNS(null, "cx", 0);
    this.el_mask.setAttributeNS(null, "cy", 0);
    this.el_mask.setAttributeNS(null, "fill", "black");

    this.el_label.textContent = "";

    this.el_group.addEventListener("mousedown",
                                  function(evt) {
                                      evt.preventDefault();
                                      if(mode == "v" && !evt.shiftKey) {
                                          dragActive = true;
                                          activeVertex = this.vertex;
                                      }
                                  },
                                  false);

    this.el_group.addEventListener("mouseup",
                                  function(evt) {
                                      var v = this.vertex;

                                      if(mode == "e" && !evt.shiftKey) {
                                          if(activeVertex == null) {
                                              activeVertex = v;
                                              activeVertex.setColor("#ff0000");
                                          } else {
                                              v.graph.addEdge(v, activeVertex)
                                              activeVertex.setColor("#0000ff");
                                              activeVertex = null;
                                          }
                                      } else if(mode == "v" && evt.shiftKey) {
                                          v.graph.removeVertex(v);
                                          evt.stopPropagation();
                                      } else if(mode == "l") {
                                          var name = prompt("Name");
                                          if(name != null) {
                                              v.el_label.textContent = name;
                                          }
                                      }
                                  },
                                  false);

    this.el_group.addEventListener("mousemove",
                                  function(evt) {
                                      evt.preventDefault();
                                      if((mode == 'v' && !dragActive) || (mode == 'e' && !evt.shiftKey)) {
                                          this.vertex.setOpacity(0.75);
                                      }
                                  },
                                  false);

    this.el_group.addEventListener("mouseout",
                                  function(evt) {
                                      evt.preventDefault();
                                      if(!dragActive) {
                                          this.vertex.setOpacity(0.5);
                                      }
                                  },
                                  false);

    this.position = Point(0, 0);

    this.remove = function() {
        this.el_group.parentNode.removeChild(this.el_group);
        this.el_mask.parentNode.removeChild(this.el_mask);
    }

    this.getPosition = function() {
        return this.position;
    }

    this.move = function(position) {
        this.position = position;
        this.el_cir.setAttributeNS(null, "cx", position.x);
        this.el_cir.setAttributeNS(null, "cy", position.y);
        this.el_label.setAttributeNS(null, "x", position.x - 4);
        this.el_label.setAttributeNS(null, "y", position.y + 4);
        this.el_mask.setAttributeNS(null, "cx", position.x);
        this.el_mask.setAttributeNS(null, "cy", position.y);
        this.redrawEdges();
    }

    this.setColor = function(color) {
        this.el_cir.setAttributeNS(null, "fill", color);
    }
     
    this.setOpacity = function(opacity) {
        this.el_cir.setAttributeNS(null, "fill-opacity", opacity);
    }

    this.redraw = function() { 
        // -
    }

    this.redrawEdges = function() {
        var v = this;

        this.graph.edges.forEach(function(edge) {
            for(var i = 0; i < 2; i++) {
                if(v == edge.vertices[i]) {
                    edge.redraw();
                }
            }
        })
    }

    this.drawTo = function(parent) {
        parent.appendChild(this.el_group);
    }

    this.drawMaskTo = function(parent) {
        parent.appendChild(this.el_mask);
    }
}

function Edge(graph, p, q) {
    this.graph = graph;
    this.vertices = [p, q];

    this.el_line = document.createElementNS(SVG_NS, "line");
    this.el_line.edge = this;

    this.el_line.setAttributeNS(null, "stroke", "#585860");
    this.el_line.setAttributeNS(null, "stroke-width", LINE_W);

    this.el_line.addEventListener("click",
                                  function(evt) {
                                      if(evt.shiftKey && mode == "e") {
                                          this.edge.graph.removeEdge(this.edge);
                                      }
                                  },
                                  false);

    this.el_line.addEventListener("mouseover",
                                  function(evt) {
                                      if(mode == "e" && evt.shiftKey) {
                                          var e = this.edge;
                                          e.el_line.setAttributeNS(null, "stroke-width", LINE_WB);
                                      }
                                  },
                                  false);

    this.el_line.addEventListener("mouseout",
                                  function(evt) {
                                      if(mode == "e") {
                                          var e = this.edge;
                                          e.el_line.setAttributeNS(null, "stroke-width", LINE_W);
                                      }
                                  },
                                  false);


    this.redraw = function() {
        this.el_line.setAttributeNS(null, "x1", this.vertices[0].position.x);
        this.el_line.setAttributeNS(null, "y1", this.vertices[0].position.y);
        this.el_line.setAttributeNS(null, "x2", this.vertices[1].position.x);
        this.el_line.setAttributeNS(null, "y2", this.vertices[1].position.y);
    }

    this.drawTo = function(parent) {
        parent.appendChild(this.el_line);
    }

    this.remove = function() {
        this.el_line.parentNode.removeChild(this.el_line);
    }
    
    this.equals = function(edge) {
        return ((this.vertices[0] == edge.vertices[0] &&
                 this.vertices[1] == edge.vertices[1]) ||
                (this.vertices[0] == edge.vertices[1] &&
                 this.vertices[1] == edge.vertices[0]));
    }
}

function Graph() {
    this.vertices = new List();
    this.edges = new List();

    /* Drawing layers */
    this.layers = {"vertices" : null,
                   "edges" : null,
                   "mask" : null};

    this.drawTo = function(vertices, edges, mask) {
        this.layers.vertices = vertices;
        this.layers.edges = edges;
        this.layers.mask = mask;
    }

    this.addVertex = function(position) {
        var v = new Vertex(this);
        v.move(position);
        this.vertices.append(v);
        
        v.drawTo(this.layers.vertices);
        v.drawMaskTo(this.layers.mask);

        if(this.onchange) {
            this.onchange(v)
        }
    }

    this.addEdge = function(p, q) {
        if(p == q || this.edgeExists(p, q)) {
            return;
        }
        
        e = new Edge(this, p, q);
        this.edges.append(e);

        e.drawTo(this.layers.edges);

        p.redraw();
        q.redraw();
        e.redraw();
        
        if(this.onchange) {
            this.onchange(e);
        }
    }

    this.removeVertex = function(vertex) {
        var g = this;

        vertex.remove();
        this.vertices.remove(vertex);

        this.edges.forEach(function(edge) {
            if(edge.vertices.indexOf(vertex) != -1) {
                g.removeEdge(edge);
            }
        });
        
        if(this.onchange) {
            this.onchange(vertex)
        }
    }

    this.removeEdge = function(edge) {
        edge.remove()
        this.edges.remove(edge);

        if(this.onchange) {
            this.onchange(edge)
        }
    }

    this.edgeExists = function(p, q) {
        var found = false;

        this.edges.forEach(function(edge) {
            if((edge.vertices[0] == p && edge.vertices[1] == q) ||
               (edge.vertices[0] == q && edge.vertices[1] == p)) {
                found = true;
            }
        });

        return found;
    }

    this.complement = function() {
        var newEdgeSet = new List();
        var p, q, e;
        
        /* Construct a new edge list of all possible edges, except those already existing */
        for(var i = 0; i < this.vertices.getSize(); i++) {
            for(var j = i + 1; j < this.vertices.getSize(); j++) {
                p = this.vertices.get(i);
                q = this.vertices.get(j);
                if(!this.edgeExists(p, q)) {
                    e = new Edge(this, p, q);
                    newEdgeSet.append(e);
                    e.drawTo(this.layers.edges);
                }
            }
        }
        
        this.removeEdges();
        this.edges = newEdgeSet;

        this.redraw();

        if(this.onchange) {
            this.onchange(null)
        }
    }

    this.removeEdges = function() {
        var g = this;
        this.edges.forEach(function(edge) {
            g.removeEdge(edge);
        });
    }

    this.removeVertices = function() {
        var g = this;
        this.vertices.forEach(function(vertex) {
            g.removeVertex(vertex);
        });
    }

    this.verticesToPolygon = function() {
        var size = this.vertices.getSize();
        var cx = 0;
        var cy = 0;
        var r = Math.min(25 + 8 * size, 150);
        
        this.vertices.forEach(function(v) {
            pos = v.getPosition();
            cx += pos.x;
            cy += pos.y;
        });
        
        cx = Math.floor(cx / size);
        cy = Math.floor(cy / size);
        
        function vertexPosition(n) {
            var angle = ((n - 1) / size) * Math.PI * 2;
            var x = cx + (r * Math.cos(angle));
            var y = cy + (r * Math.sin(angle));
            
            return new Point(x, y);
        }
        
        for(var i = 0; i < this.vertices.getSize(); i++) {
            this.vertices.get(i).move(vertexPosition(i));
        }
    }

    this.redraw = function() {
        this.vertices.forEach(function(vertex) {
            vertex.redraw();
        });

        this.edges.forEach(function(edge) {
            edge.redraw();
        });
    }
}

function getRelativeMousePosition(evt) {
    var x = displayCont.offsetLeft;
    var y = displayCont.offsetTop;

    return new Point(evt.clientX - x + window.scrollX, evt.clientY - y + window.scrollY);
}

function setInfo() {
    /* Clear all status */
    document.getElementById("info-e").style.display = "none";
    document.getElementById("info-v").style.display = "none";
    document.getElementById("info-l").style.display = "none";

    /* Display correct status */
    if(mode == "e") {
        document.getElementById("info-e").style.display = "block";
    } else if(mode == "v") {
        document.getElementById("info-v").style.display = "block";
    } else if(mode == "l") {
        document.getElementById("info-l").style.display = "block";
    }
}

function setStatusLine() {
    statusLine.innerHTML = graph.vertices.getSize() + " vertices / " + graph.edges.getSize() + " edges";
}

function removeAllVertices(evt) {
    document.getElementById("dummy-button").focus();
    graph.removeVertices();
}

function handleKeyPress(evt) {
    var c = String.fromCharCode(evt.keyCode);
    
    if(c == "E") {
        mode = "e";
    } else if(c == "V") {
        mode = "v";
        dragActive = false;
    } else if(c == "L") {
        mode = "l";
    } else if(c == "C") {
        graph.complement();
    } else if(evt.shiftKey && c == "R") {
        graph.removeEdges();
    } else if(evt.shiftKey && c == "P") {
        graph.verticesToPolygon();
    } else {
        return;
    }
    
    activeVertex = null;
    setInfo();
}

function handleMouseMove(evt) {
    evt.preventDefault();
    if(dragActive) {
        mousePos = getRelativeMousePosition(evt);
        mousePos.x -= 5;
        mousePos.y -= 5;

        activeVertex.move(mousePos);
    }
}

function handleMouseUp(evt) {
    evt.preventDefault();

    if(mode == "v") {
        dragIgnoreMouseUp = false;
        if(dragActive) {
            dragIgnoreMouseUp = true;
            dragActive = false;
            activeVertex = null;
        } else if(dragIgnoreMouseUp) {
            dragIgnoreMouseUp = false;
        } else if(!evt.shiftKey) {

            if(dragActive || dragIgnoreMouseUp || mode != "v") {
                dragIgnoreMouseUp = false;
                return;
            }
    
            var mousePos = getRelativeMousePosition(evt);
            mousePos.x -= 5;
            mousePos.y -= 5;

            graph.addVertex(mousePos);
        }
    }
}

function init() {
    /* Elements */
    display = document.getElementById("display");
    displayCont = document.getElementById("display-cont");
    statusLine = document.getElementById("status");
    verticesGroup = document.getElementById("vertices");
    verticesMask = document.getElementById("vertices-mask");
    edgesGroup = document.getElementById("edges");

    /* Set layers */
    graph.drawTo(verticesGroup, edgesGroup, verticesMask);
    graph.onchange = setStatusLine;

    /* Place the key listener on the document rather than the SVG element */
    document.addEventListener("keyup", handleKeyPress, false);
    
    /* Prevents the browser from trying to drag elements */
    display.addEventListener("mousedown", function(evt){evt.preventDefault();}, false);

    /* Handlers */
    display.addEventListener("mousemove", handleMouseMove, false);
    display.addEventListener("mouseup", handleMouseUp, false);

    setStatusLine();
    setInfo();
}
