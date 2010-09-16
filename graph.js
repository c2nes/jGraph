
SVG_NS = "http://www.w3.org/2000/svg"
VERTEX_R = 10;

mode = "v";

dragActive = false;
dragIgnoreMouseUp = false;
activeVertex = null;

vertexSet = new Set();
edgeSet = new Set();

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Set(values) {
    if(values) {
        this.data = new Array(values);
    } else {
        this.data = new Array();
    }

    this.getSize = function() {
        return this.data.length;
    }
    
    this.remove = function(item) {
        index = this.data.indexOf(item);
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
        cp = this.data.slice(0);
        for(var i = 0; i < cp.length; i++) {
            f(cp[i]);
        }
    }

    this.map = function(f) {
        r = [];
        for(var i = 0; i < this.getSize(); i++) {
            r.push(f(this.get(i)));
        }

        return new Set(r);
    }
}

function Vertex() {
    this.name = "";

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

    this.el_group.addEventListener("mouseover",
                                  function(evt) {
                                      evt.preventDefault();
                                      if(!dragActive) {
                                          this.vertex.el_cir.setAttributeNS(null, "fill-opacity", 0.75);
                                      }
                                  },
                                  false);

    this.el_group.addEventListener("mouseout",
                                  function(evt) {
                                      evt.preventDefault();
                                      if(!dragActive) {
                                          this.vertex.el_cir.setAttributeNS(null, "fill-opacity", 0.5);
                                      }
                                  },
                                  false);

    this.el_group.addEventListener("mouseup",
                                  function(evt) {
                                      if(mode == "e" && !evt.shiftKey) {
                                          if(activeVertex == null) {
                                              activeVertex = this.vertex;
                                              activeVertex.el_cir.setAttributeNS(null, "fill", "#ff0000");
                                          } else {
                                              if(this.vertex != activeVertex) {
                                                  e = new Edge(this.vertex, activeVertex);
                                                  edgeSet.append(e);
                                                  this.vertex.redrawEdges();
                                                  activeVertex.redrawEdges();
                                                  e.drawTo(document.getElementById("edges"));
                                              }
                                              activeVertex.el_cir.setAttributeNS(null, "fill", "#0000ff");
                                              activeVertex = null;
                                          }
                                      } else if(mode == "v" && evt.shiftKey) {
                                          v = this.vertex;
                                          vertexSet.remove(v);

                                          edgeSet.forEach(function(edge) {
                                              if(edge.vertices.indexOf(v) != -1) {
                                                  edge.remove();
                                              }
                                          });

                                          v.el_group.parentNode.removeChild(v.el_group);
                                          v.el_mask.parentNode.removeChild(v.el_mask);
                                          
                                          evt.stopPropagation();
                                      } else if(mode == "l") {
                                          name = prompt("Name");
                                          if(name != null) {
                                              this.vertex.el_label.textContent = name;
                                          }
                                      }
                                  },
                                  false);

    this.position = Point(0, 0);

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

    this.setColor = function(color, opacity) {
        this.el_cir.setAttributeNS(null, "fill", color);
        this.el_cir.setAttributeNS(null, "fill-opacity", opacity);
    }

    this.redrawEdges = function() {
        v = this;

        edgeSet.forEach(function(edge) {
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
    
    this.equals = function(edge) {
        return ((this.vertices[0] == edge.vertices[0] &&
                 this.vertices[1] == edge.vertices[1]) ||
                (this.vertices[0] == edge.vertices[1] &&
                 this.vertices[1] == edge.vertices[0]));
    }
}

function Edge(p, q) {
    this.vertices = [p, q];

    this.el_line = document.createElementNS(SVG_NS, "line");
    this.el_line.edge = this;

    this.el_line.setAttributeNS(null, "stroke", "#585860");
    this.el_line.setAttributeNS(null, "stroke-width", "2");

    this.el_line.addEventListener("click",
                                  function(evt) {
                                      if(evt.shiftKey && mode == "e") {
                                          e = this.edge;
                                          e.remove();
                                      }
                                  },
                                  false);

    this.el_line.addEventListener("mouseover",
                                  function(evt) {
                                      if(mode == "e" && evt.shiftKey) {
                                          e = this.edge;
                                          e.el_line.setAttributeNS(null, "stroke-width", "6");
                                      }
                                  },
                                  false);

    this.el_line.addEventListener("mouseout",
                                  function(evt) {
                                      if(mode == "e") {
                                          e = this.edge;
                                          e.el_line.setAttributeNS(null, "stroke-width", "2");
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
        edgeSet.remove(this);
        this.el_line.parentNode.removeChild(this.el_line);
    }

    this.redraw();
}

function getRelativeMousePosition(evt) {
    element = document.getElementById("displayCont");

    x = element.offsetLeft;
    y = element.offsetTop;

    return new Point(evt.clientX - x, evt.clientY - y);
}

function Display() {
    return document.getElementById("display");
}

function addVertex(evt) {
    evt.preventDefault();

    if(dragActive || dragIgnoreMouseUp || mode != "v") {
        dragIgnoreMouseUp = false;
        return;
    }
    
    mousePos = getRelativeMousePosition(evt, Display());
    mousePos.x -= 5;
    mousePos.y -= 5;

    v = new Vertex();
    v.move(mousePos);
    vertexSet.append(v);

    v.drawTo(document.getElementById("vertices"));
    v.drawMaskTo(document.getElementById("vertices-mask"));
}

function mouseMove(evt) {
    evt.preventDefault();

    if(dragActive) {
        mousePos = getRelativeMousePosition(evt, Display());
        mousePos.x -= 5;
        mousePos.y -= 5;

        activeVertex.move(mousePos);
    }
}

function setStatus() {
    /* Clear all status */
    document.getElementById("status-e").style.display = "none";
    document.getElementById("status-v").style.display = "none";
    document.getElementById("status-l").style.display = "none";

    /* Display correct status */
    if(mode == "e") {
        document.getElementById("status-e").style.display = "block";
    } else if(mode == "v") {
        document.getElementById("status-v").style.display = "block";
    } else if(mode == "l") {
        document.getElementById("status-l").style.display = "block";
    }
}

function existsEdge(p, q) {
    var found = false;
    edgeSet.forEach(function(edge) {
        if((edge.vertices[0] == p && edge.vertices[1] == q) ||
           (edge.vertices[0] == q && edge.vertices[1] == p)) {
            found = true;
        }
    });

    return found;
}

function invertGraph() {
    newEdgeSet = new Set();

    /* Construct a new edge list of all possible edges, except those already existing */
    for(var i = 0; i < vertexSet.getSize(); i++) {
        for(var j = i + 1; j < vertexSet.getSize(); j++) {
            p = vertexSet.get(i);
            q = vertexSet.get(j);
            if(!existsEdge(p, q)) {
                e = new Edge(p, q);
                newEdgeSet.append(e);
                e.drawTo(document.getElementById("edges"));
                e.redraw();
            }
        }
    }

    edgeSet.forEach(function(edge) {
        edge.remove()
    });

    edgeSet = newEdgeSet;
}

function removeAllEdges() {
    edgeSet.forEach(function(edge) {
        edge.remove()
    });
}

function getKeyCode(c) {
    return c.charCodeAt(0);
}

function init() {
    /* Place the key listener on the document rather than the SVG element */
    document.addEventListener("keyup",
                              function(evt) {
                                  if(evt.keyCode == getKeyCode('E')) {
                                      mode = "e";
                                  } else if(evt.keyCode == getKeyCode('V')) {
                                      mode = "v";
                                      dragActive = false;
                                  } else if(evt.keyCode == getKeyCode('L')) {
                                      mode = "l";
                                  } else if(evt.shiftKey && evt.keyCode == getKeyCode('I')) {
                                      invertGraph();
                                  } else if(evt.shiftKey && evt.keyCode == getKeyCode('C')) {
                                      removeAllEdges();
                                  } else {
                                      return;
                                  }
                                  
                                  activeVertex = null;
                                  setStatus();
                              },
                              false);
    
    /* Prevents the browser from trying to drag elements */
    Display().addEventListener("mousedown", function(evt){evt.preventDefault();}, false);

    Display().addEventListener("mousemove", mouseMove, false);
    Display().addEventListener("mouseup",
                               function(evt) {
                                   if(mode == "v") {
                                       dragIgnoreMouseUp = false;
                                       if(dragActive) {
                                           dragIgnoreMouseUp = true;
                                           dragActive = false;
                                           activeVertex = null;
                                       } else if(dragIgnoreMouseUp) {
                                           dragIgnoreMouseUp = false;
                                       } else if(!evt.shiftKey) {
                                           addVertex(evt);
                                       }
                                   }
                               },
                               false);

    setStatus();
}
