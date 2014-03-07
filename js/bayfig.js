var Bayfig = Bayfig || {};
var bf = Bayfig; // shortname

/***
INPUT
***/


Bayfig.loadInput = function() {

    var inputFile = $('#selectDemoData option:selected').val();
    
    $('#textareaInput').load(inputFile, function() {
        // callback
        if ($('#checkboxAutoload').attr('checked') === 'checked')
            Bayfig.initialize();
    });
};

$('#selectDemoData').change(function() {

    // get current dropdown selection from demo data
    var inputDemoOption = this.options[this.selectedIndex];

    // load input into text area
    if (inputDemoOption.value !== 'nothing') {
        $.get(inputDemoOption.value, function(response) {
            Bayfig.inputStr = response;
        })
        .success(function() {})
        .error(function() {})
        .complete(function() {});
    }
});


/***
INIT
***/

Bayfig.initialize = function() {

    // parse input from textareaInput
    this.parseInput();

    // init data
    this.initTaxa();
    this.initGeo();
    this.initSettings();
    this.initTree();

    // redraw divs
    console.log("redrawDivs()\n");
    this.redrawDivs();

    // draw
    console.log("drawTree()\n");
    this.drawTree();
    console.log("drawGeo()\n");
    this.drawGeo();
    console.log("drawMarkers()\n");
    this.drawMarkers();
    console.log("drawLegend()\n");
    this.drawLegend();

};

Bayfig.redrawDivs = function() {

    $( '#textareaInput' ).remove();
    $( '#divCtrlTop' ).remove();
    $( '#divCtrlBottom' ).remove();
    $( '#divPhylo' ).remove();
    $( '#container' ).append('<div id="divDraw"></div>');
    $( '#container' ).append('<div id="divText"></div>');

    this.divDrawMargin = 20;
    $( '#divDraw' ).height(this.canvasheight);
    $( '#divDraw' ).width(this.canvaswidth);
    $( '#divDraw' ).css({left:this.mapwidth,top:this.mapheight,margin:this.divDrawMargin});
    $( '#divText' ).height(this.canvasheight);
    $( '#divText' ).width(250);
    this.divDrawOffset = $('#divDraw').offset();
    $( '#divText' ).css({left:this.canvaswidth+this.mapwidth+this.divDrawOffset.left+10,top:this.mapheight+this.divDrawMargin});
};

Bayfig.parseInput = function() {

    // get input
    this.inputStr = $( '#textareaInput' ).val();
    if (this.inputStr === '')
        return;

    // tokenize
    var inputTokens = this.inputStr.split(/\r\n|\r|\n/);

    // parse inputTokens
    this.taxaStr = '';
    this.treeStr = '';
    this.geoStr = '';
    this.settingsStr = '';
    var parseSelect = '';

    for (var i = 0; i < inputTokens.length; i++)
    {
        if (inputTokens[i] === 'End;')
            parseSelect = '';
        else if (inputTokens[i] === 'Begin bayarea-fig;')
            parseSelect = 'bayarea-fig';
        else if (inputTokens[i] === 'Begin taxa;')
            parseSelect = 'taxa';
        else if (inputTokens[i] === 'Begin geo;')
            parseSelect = 'geo';
        else if (inputTokens[i] === 'Begin trees;')
            parseSelect = 'tree';
        else if (parseSelect === 'bayarea-fig')
            this.settingsStr += inputTokens[i] + '\n';
        else if (parseSelect === 'taxa')
            this.taxaStr += inputTokens[i] + '\n';
        else if (parseSelect === 'geo')
            this.geoStr += inputTokens[i] + '\n';
        else if (parseSelect === 'tree')
            this.treeStr += inputTokens[i] + '\n';
        else
            ; // do nothing
    }
};

Bayfig.initSettings = function() {

    this.mapheight=100;
    this.mapwidth=150;
    this.canvasheight=2000;
    this.canvaswidth=1000;
    this.minareaval=0.1;
    this.areacolors=["black"];
    this.areatypes=[];
    this.areanames=["All"];
    for (var i = 0; i < this.numGeo; i++)
        this.areatypes[i] = 0

    this.settingsTokens = this.settingsStr.split('\n');
    for (var i = 0; i < this.settingsTokens.length; i++)
    {
        var lineTokens = trim1(this.settingsTokens[i]).split(/\s+/g);
        if (lineTokens.length > 1)
        {
            if (lineTokens[0] === "mapheight")
                this.mapheight = parseInt(lineTokens[1]);
            else if (lineTokens[0] === "mapwidth")
                this.mapwidth = parseInt(lineTokens[1]);
            else if (lineTokens[0] === "canvasheight")
                this.canvasheight = parseInt(lineTokens[1]);
            else if (lineTokens[0] === "canvaswidth")
                this.canvaswidth = parseInt(lineTokens[1]);
            else if (lineTokens[0] === "minareaval")
                this.minareaval = parseFloat(lineTokens[1]);
            else if (lineTokens[0] === "areacolors")
            {
                colors = []
                for (var j = 1; j < lineTokens.length; j++)
                    colors.push(lineTokens[j]);
                this.areacolors = colors; 
            }
            else if (lineTokens[0] === "areatypes")
            {
                types = []
                for (var j = 1; j < lineTokens.length; j++)
                    types.push(parseInt(lineTokens[j]));
                this.areatypes = types;
            }
            else if (lineTokens[0] === "areanames")
            {
                names = []
                for (var j = 1; j < lineTokens.length; j++)
                    names.push(lineTokens[j]);
                this.areanames = names;

            }
        }

    }
};


Bayfig.initTaxa = function() {

    this.taxaTokens = this.taxaStr.split('\n');
    this.numTaxa = -1;
    this.taxaNames = [];
    var taxaIdx = -1;

    for (var i = 0; i < this.taxaTokens.length; i++)
    {
        var lineTokens = trim1(this.taxaTokens[i]).split(/\s+/g);

        // get number of taxa
        if (lineTokens.length > 1)
            if (lineTokens[0] === 'Dimensions')
                this.numTaxa  = parseInt(lineTokens[1].split('=')[1].slice(0,-1));
  }
};


Bayfig.initGeo = function() {


    this.geoTokens = this.geoStr.split('\n');
    this.numGeo = -1;
    this.geoData = [];
    var coordsIdx = -1;
    
    // get map coordinates
    for (var i = 0; i < this.geoTokens.length; i++)
    {
        var lineTokens = trim1(this.geoTokens[i]).split(/\s+/g);

        // get number of taxa
        if (lineTokens.length > 1)
            if (lineTokens[0] === 'Dimensions')
                this.numGeo  = parseInt(lineTokens[1].split('=')[1].slice(0,-1));

        // get taxon names
        if (lineTokens[0] === 'Coords')
            coordsIdx = 0;

        else if (coordsIdx >= 0 && coordsIdx < this.numGeo)
        {
            if (lineTokens[2].indexOf(';') !== -1)
                lineTokens[2] = lineTokens[2].slice(0,-1);
            this.geoData[coordsIdx] = 
            {
                name: lineTokens[0],
                lat: parseFloat(lineTokens[1]),
                lon: parseFloat(lineTokens[2])
            };
            coordsIdx++;
        }
    }

    // get distances between areas
    this.earthRadius = Math.pow(6.37,6) 
    this.sumDistances = 0.0;
    this.geoDistances = [];
    for (var i = 0; i < this.numGeo; i++)
        this.geoDistances[i] = [];
    for (var i = 0; i < this.numGeo; i++)
    {
        this.geoDistances[i][i] = 0.0
        for (var j = i + 1; j < this.numGeo; j++)
        {
            this.geoDistances[i][j] = this.haversineDistance(this.geoData[i],this.geoData[j]);
            this.geoDistances[j][i] = this.haversineDistance(this.geoData[i],this.geoData[j]);
            this.sumDistances += this.geoDistances[i][j];
        }
    }
    
};

Bayfig.haversineDistance = function(a,b) {
    var x = Math.pow(Math.sin((b.lat - a.lat)/2),2) + Math.cos(a.lat) * Math.cos(b.lat) * Math.pow(Math.sin((b.lon-a.lon)/2),2)
    return 2 * Bayfig.earthRadius * Math.asin(Math.sqrt(x));

};

Bayfig.calcDistanceDensity = function(area_pp) {
    
    //console.log(area_pp);
    var x = 0.0;
    for (var i = 0; i < this.numGeo; i++)
    {
        for (var j = i + 1; j < this.numGeo; j++)
        {
            x += area_pp[i] * area_pp[j] * Math.pow(this.geoDistances[i][j],2.6);
        }
    }
    return x;
};

Bayfig.Node = function() {

    return function() {
        this.id = -1;
        this.postorderId = -1;
        this.name = '';
        this.len = 0.0;
        this.cladeLen = 0.0;
        this.height = 0.0;
        this.coord = 0.0;
        this.ancestor = null;
        this.descendants = [];
        this.color = [0,0,0];
        this.data = null;
        this.drawXY = {x1:-1,y1:-1,x2:-1,y2:-1}
    }
}();

Bayfig.initTree = function() {

    // parse treeStr
    this.treeTokens = this.treeStr.split('\n');
    this.nhxStr = "";
    this.nodes = [];
    var nodeIdx = -1;
    
    for (var i = 0; i < this.treeTokens.length; i++)
    {
        //console.log(i,this.treeTokens[i]);
        var lineTokens = trim1(this.treeTokens[i]).split(/\s+/g).filter(function() { return true} );
        console.log(i, lineTokens);

        // get taxon names
        if (lineTokens[0] === 'Translate')
            nodeIdx = 0;

        else if (nodeIdx >= 0 && nodeIdx < this.numTaxa)
        {
            if (lineTokens[1].indexOf(';') !== -1 || lineTokens[1].indexOf(',') !== -1)
            {
                //console.log(i,lineTokens);
                lineTokens[1] = lineTokens[1].slice(0,-1);
            }
            var idx = parseInt(lineTokens[0]);
            /*
            this.nodes[nodeIdx] = new Bayfig.Node();
            this.nodes[nodeIdx].id = idx;
            this.nodes[nodeIdx].name = lineTokens[1];
            */
            this.taxaNames[idx] = lineTokens[1].replace("_"," ");
            nodeIdx++;
        }

        else if (lineTokens[0] === 'tree')
        {
            console.log("hi")
            if (lineTokens[2] === '=')
            {
                console.log("A")
                this.nhxStr = lineTokens[3];
            }
            else {
                console.log("B")
                var lt = lineTokens[1];
                this.nhxStr = lt.slice(lt.indexOf('='),lt.length);
            }
            console.log(this.nhxStr);
        }

    }
  
    Bayfig.buildTree();

   // create tree structure
   // attach all states to nodes
   // compute draw variables

};

Bayfig.buildTree = function() {
    
    // console.log(this.nhxStr);

    // tokenize nhx string
    var readTaxonName = false;
    var readBrlen = false;
    var readData = false;
    var temp = "";
    var newickTokens = [];

    for (var i = 0; i < this.nhxStr.length; i++) {
        var c = this.nhxStr[i];
        if (c === ' ')
            continue;
        if (   c === '(' || c === ')'
            || c === ':' || c === ';'
            || c === '[' || c === ']'
            || c === ',' || c === '&') {

            temp = c;
            newickTokens.push(temp);
            if (c === ':')
                readBrlen = true;
            else if (c === '(' || c === ')' || c === ';' || c === ',')
                readBrlen = false;
            else if (c === '[')
                readData = true;
            else if (c === ']')
                readData = false;
        }
        else {
            var j = i;
            var taxonName = "";
            while (    this.nhxStr[j] !== '('
                    && this.nhxStr[j] !== ')'
                    && (this.nhxStr[j] !== ',' || readData === true)
                    && this.nhxStr[j] !== ':'
                    && this.nhxStr[j] !== ';'
                    && this.nhxStr[j] !== '['
                    && this.nhxStr[j] !== ']' )
            {
                //console.log(readData, this.nhxStr[j]);
                taxonName += this.nhxStr[j];
                j++;
            }
            newickTokens.push(taxonName);
            i = j - 1;
        }
        if (c === ';')
            break;
    }

    //console.log(newickTokens);

    // construct tree from tokens
    this.root = null;
    var p = null;
    var readBrlen = false;
    var readData = false;

    for (var i = 0; i < newickTokens.length; i++) {
        
        // indicates new node
        if (newickTokens[i] === '(') {
        
            if (p === null) {
                p = new Bayfig.Node;
                this.nodes.push(p);
                this.root = p;
            }
            else {
                var q = new Bayfig.Node;
                q.ancestor = p;
                this.nodes.push(q);
                p.descendants.push(q);
                p = q;
            }
            readBrlen = false;
            readData = false;
        }

        // indicates end of clade
        else if (newickTokens[i] === ')') {
            if (p.ancestor !== null) {
                p = p.ancestor;
            }
            else {
                console.log('Bayfig.initTree(): Problem going down tree');
            }
            readBrlen = false;
            readData = false;
        }

        // indicates divergence event
        else if (newickTokens[i] === ',') {
            if (p.ancestor !== null) {
                p = p.ancestor;
            }
            else {
                console.log('Bayfig.initTree(): Problem going down tree');
            }
            readBrlen = false;
            readData = false;
        }

        // next token is branch length
        else if (newickTokens[i] === ':') {
            readBrlen = true;
            readData = false;
        }

        // next token is starts nhx data
        else if (newickTokens[i] === '[') {
            readBrlen = false;
            readData = true;
        }

        // next token ends nhx data
        else if (newickTokens[i] === ']') {
            readBrlen = false;
            readData = false;
        }

        // next token is variable
        else if (newickTokens[i] === '&')
            ;

        // no tokens should remain
        else if (newickTokens[i] === ';') {
            ;
        }
    
        else {

            // taxon name token
            if (!readBrlen && !readData) {
                var tipIdx = parseInt(newickTokens[i]);
                var tipName = this.taxaNames[tipIdx];

                // internal node
                if (newickTokens[i-1] === ')') {
                    p.id = parseInt(newickTokens[i])
                    p.name = newickTokens[i];
                }

                // tip node
                else {
                    var q = new Bayfig.Node;
                    q.id = tipIdx;
                    q.ancestor = p;
                    q.name = tipName;
                    this.nodes.push(q);
                    p.descendants.push(q);
                    p = q;
                }
            }

            // branch length token
            else if (readBrlen && !readData) {
                var x = parseFloat(newickTokens[i]);
                if (x < 0.00001)
                    x = 0.00001;
                p.len = x;
                readBrlen = false;
            }

            // nhx data
            else if (readData) 
            
            {

                // split for each variable by &
                nhxTokens = newickTokens[i].split('&');
                for (var j = 0; j < nhxTokens.length; j++) {

                    // find variable value assignments
                    var varTokens = nhxTokens[j].split('=');

                    if (varTokens[0] === 'area_pp') {
                        valTokens = varTokens[1].slice(1,-1).split(',');
                        valVec = [];
                        for (var k = 0; k < valTokens.length; k++)
                            valVec[k] = parseFloat(valTokens[k])
                        p.area_pp = valVec;
                    }
                    else {
                        ; // e.g. other variables
                    }
                }
            }
        }
    }
    this.numNodes = this.nodes.length;
    var nodeIdx = this.numTaxa + 1;
    for (var i = 0; i < this.numNodes; i++)
        if (this.nodes[i].id === -1)
            this.nodes[i].id = nodeIdx++;

    // assign postorder
    this.nodesPostorder = [];
    var poIdx = 0;

    var downPass = function(p) {
        if (p.descendants.length > 0) {
            for (var i = 0; i < p.descendants.length; i++) {
                downPass(p.descendants[i]);
            }
        }
        p.postorderId = poIdx;
        Bayfig.nodesPostorder[poIdx] = p;
        poIdx++;
    }
    downPass(this.root);

    // assign node heights
    for ( var i = this.numNodes - 1; i >= 0; i--) {

        var p = Bayfig.nodesPostorder[i];
        if (p.ancestor !== null)
            p.height = p.ancestor.height + p.len;
        else
            p.height = 0.0;
    }

    // get tree height
    this.treeHeight = 0.0;
    for (var i = 0; i < this.numTaxa; i++) {
        if (this.nodes[i].height > this.treeHeight)
            this.treeHeight = this.nodes[i].height;
    }



    // sort nodes by clade length
    // UNTESTED

    function compareCladeLen(a,b) {
        if (a.cladeLen < b.cladeLen)
            return -1;
        if (a.cladeLen > b.cladeLen)
            return 1;
        return 0;
    }

    for (var i = 0; i < this.nodes.length; i++) {
        var p = Bayfig.nodesPostorder[i];
        if (p.descendants.length !== 0)
        {
            for (var j = 0; j < p.descendants.length; j++) {
                p.cladeLen += p.descendants[j].cladeLen;
            }
            p.descendants = p.descendants.sort(compareCladeLen);
        }
        p.cladeLen += p.len;
    }

    // add legend node
    tmp_vec = []
    for (var i = 0; i < this.numGeo; i++)
        tmp_vec[i] = 1.0  
    this.legendNode = {
        'area_pp': tmp_vec 
    };
    
};

Bayfig.drawTree = function() {
    

    var offsetH = 10.0
    
    var divH = $('#divDraw').height(),
        divW = $('#divDraw').width(),
        unitsH = (divH - 2*offsetH) / (this.numTaxa - 1),
        unitsW = divW / this.treeHeight,
        color = "black";

    this.treeSvg = d3.select('#divDraw')
                       .append('svg:svg')
                       .attr('width',divW)
                       .attr('height',divH);

    this.textSvg = d3.select('#divText')
                       .append('svg:svg')
                       .attr('width', $('#divText').width())
                       .attr('height', $('#divText').height());

    this.phyloDrawData = [];

    // first pass, assign tips to positions 0, 1, 2 ...
    var count = 0;
    for (var i = 0; i < this.numNodes; i++) {

        // grab node
        var p = this.nodesPostorder[i];

        // check if tip and assign if true
        if (p.descendants.length === 0) {
            p.coord = count;
            count++;
        }
    }

    // second pass, settings coord based on child nodes
    for (var i = 0; i < this.numNodes; i++) {

        // grab node
        var p = this.nodesPostorder[i];

        // parent node is average of child nodes
        if (p.descendants.length > 0) {
            p.coord = 0.0;
            for (var j = 0; j < p.descendants.length; j++)
                p.coord += p.descendants[j].coord;
            p.coord /= p.descendants.length;
        }
    }

    // third pass, settings branch attributes
    for (var i = 0; i < this.numNodes; i++) {

        // grab node and parent node
        var p = this.nodesPostorder[i],
            pp = p.ancestor,
            ppheight = (pp !== null ? pp.height : 0);

        var xStart = ppheight * unitsW,
            xEnd = p.height * unitsW,
            yStart = p.coord * unitsH + offsetH,
            yEnd = p.coord * unitsH + offsetH;

        // offset borders

        if (yEnd === divH) yEnd -= 2;
        if (yStart === divH) yStart -= 2;
        if (yStart === 0.0) yStart += 2;
        if (yEnd === 0.0) yEnd += 2;
        if (xStart === 0.0) xStart += 2;


        this.phyloDrawData.push({
            "name": p.name,
            "id": p.id,
            "horz": true,
            "area_pp": p.area_pp,
            "p_area_pp": (pp !== null ? pp.area_pp : null),
            "height": p.height,
            "x1phy": xStart,
            "x2phy": xEnd,
            "y1phy": yEnd,
            "y2phy": yEnd,
            "color": color
        });

        if (pp !== null) {
            var yStart = pp.coord * unitsH;
            
            this.phyloDrawData.push({
                "name": p.name,
                "id": p.id,
                "horz": false,
                "area_pp": p.area_pp,
                "p_area_pp": pp.area_pp,
                "x1phy": xStart,
                "x2phy": xStart,
                "y1phy": yStart,
                "y2phy": yEnd,
                "color": color
            });
        }

        else 
            this.xRoot = xEnd;

    }

    this.treeTipText = this.textSvg.selectAll("text.phylo")
        .data(this.phyloDrawData.filter(function(d) {
            if (d.horz === true) return d;
        }))
      .enter().append("svg:text")
        .attr("class","text")
        .text(function(d) { return d.name; })
        .attr("x", function(d) { return 5; })
        .attr("y", function(d) { 
            var y = d.y2phy;
            //return y+80;//+5;
            return y+5;
            /*if (y > 0) return y;
            else return y + 10;*/
        })
        .attr("fill", "black")
        .attr("font-size","16");

    var scale = d3.scale.linear()
        .domain([0,1])
        .range(["black","black"]);

    var scaleDist = d3.scale.linear()
        .domain([0,150000000000000])//this.sumDistances])
        .range(["black","black"]);

    var wallace = [0,1,2,3,4,5,6,7,8,9]; //]; var lydekker = [7,8,9];
    this.treeDrawLines = this.treeSvg.selectAll("rect.phylo")
        .data(this.phyloDrawData)
        .enter()
        .append("svg:rect")
        .attr("class","phylo")
        .attr("x", function(d) { return d.x1phy; })
        .attr("width", function(d) { 
            var sumpp = 0;
            for (var i = 0; i < d.area_pp.length; i++)
                sumpp += d.area_pp[i];
            return d.x2phy - d.x1phy + 2; //2 * sumpp; //2;
        })
        .attr("y", function(d) {
            if (d.y2phy > d.y1phy) return d.y1phy;
            else return d.y2phy;
        })
        .attr("height", function(d) {
            var sumpp = 0;
            for (var i = 0; i < d.area_pp.length; i++)
                sumpp += d.area_pp[i];
            if (d.y2phy > d.y1phy) return d.y2phy - d.y1phy + 2;//sumpp;
            else return d.y1phy - d.y2phy + 2;//sumpp;
        })
        .attr("fill", function(d) {
        
        /*
            // get terminal colors
            var p00 = 0, p0n = 0, p10 = 0, p1n = 0;
            for (var i = 0; i < d.area_pp.length; i++) {
                if (wallace.indexOf(i) !== -1)
                {
                    p00 += d.area_pp[i];
                    if (d.p_area_pp !== null)
                        p10 += d.p_area_pp[i];
                    else
                        p10 += d.area_pp[i];
                }
                p0n += d.area_pp[i];
                p1n += (d.p_area_pp !== null ? d.p_area_pp[i] : d.area_pp[i]);
            }
            var p0 = scale(p00 / p0n);
            var p1 = scale(p10 / p1n);
            console.log(d.name, p0, p1, p00/p0n, p10/p1n, d.area_pp);

            // distance density colors
            var d0 = scaleDist(Bayfig.calcDistanceDensity(d.area_pp));
            var d1 = scaleDist(Bayfig.calcDistanceDensity((d.p_area_pp !== null ? d.p_area_pp : d.area_pp)));
            console.log("distance density",d0,d1);

            if (d.horz) {
                var gradient = Bayfig.treeSvg.append("svg:defs")
                  .append("svg:linearGradient")
                    .attr("id", "gradient" + d.id)
                    .attr("x1", "0%")
                    .attr("x2", "100%")
                    .attr("y1", "0%")
                    .attr("y2", "0%")
                    .attr("spreadMethod", "pad");

                gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", p1)
                    .attr("stop-opacity", 1);

                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", p0)
                    .attr("stop-opacity", 1);

                return "url(#gradient" + d.id + ")";
            }
            else return p1;
        */
        return "black";
        })
        .on("click", function(d) { console.log(d); }) // allow user to show/hide lineage ASRs
        .on("dblclick", null);

};

Bayfig.drawGeo = function() {
   
    // div size
    var divH = document.getElementById("divDraw").offsetHeight,
        divW = document.getElementById("divDraw").offsetWidth;

    var meanLat = 0,
        meanLon = 0,
        minLat = 90,
        maxLat = -90,
        minLon = 180,
        maxLon = -180;

    // find center and extent of coords
    for (var i = 0; i < this.geoData.length; i++) {
        
        var lat = this.geoData[i].lat;
        meanLat += lat;
        if (lat < minLat) { minLat = lat; }
        if (lat > maxLat) { maxLat = lat; }

        var lon = this.geoData[i].lon;
        if (lon < minLon) { minLon = lon; }
        if (lon > maxLon) { maxLon = lon; }

        // shift to 0,360
        if (lon < 0) { lon = 360 + lon; }
        meanLon += lon;
    }

    meanLat /= this.geoData.length;
    meanLon /= this.geoData.length;
    meanLat = (maxLat + minLat) / 2 - 2;
    meanLon = (maxLon + minLon) / 2 + 5;


    //console.log(minLat,minLon,maxLat,maxLon,meanLat,meanLon);

    // restore to -180,180
    if (meanLon > 180)
        meanLon -= 360;

    // create polymaps objects
    var po = org.polymaps;
    this.po = po;
    var url = "http://{S}tile.cloudmade.com"
        + "/5b7ebc9342d84da7b27ca499a238df9d"
        + "/41232@2x/256/{Z}/{X}/{Y}.png";

    this.mapSvg = [];
    this.mapPo = [];
    // map per node + one for legend
    for (var i = 0; i < this.numNodes + 1; i++) {
        
        isLegend = false
        if (i == this.numNodes)
            isLegend = true

        // legend
        if (isLegend)
            var p = this.nodes[0];
        // nodes
        else
            var p = this.nodes[i];

        var fo = this.phyloDrawData.filter(function(d) {
                if (d.horz === true && d.id === p.id) {
                    return d;
                }
            });
        if (fo.length === 1)
            fo = fo[0];

        var go = { 
            'x': fo.x2phy,
            'y': fo.y1phy,
            'h': this.mapheight,
            'w': this.mapwidth
        };
        if (isLegend)
        {
            go.x = this.mapwidth +5; // 0;
            go.y = this.mapheight - 50; // 20;
            go.h = this.mapheight;
            go.w = this.mapwidth;
        }
    
        var divStr = '';
        if (p.descendants.length === 0) {
            
            // create div for each tip
            // perhaps create a map and label div to the right of the tree
            divStr += '<div id=\"divMap' + i + '\" style=\"';
            divStr += 'position: absolute; ';
            divStr += 'border: 1px solid black; ';
            divStr += 'top: ' + (go.y - go.h/2) + 'px; ';
            divStr += 'left: ' + (go.x + 5) + 'px; ';
            divStr += 'height: ' + go.h + 'px; ';
            divStr += 'width: ' + go.w + 'px;';
            divStr += '\"></div>';
            $('#divDraw').append(divStr);
        }

        // create div for each node in divDraw
        else {

            divStr += '<div id=\"divMap' + i + '\" style=\"';
            divStr += 'position: absolute; ';
            divStr += 'border: 1px solid black; ';
            divStr += 'top: ' + (go.y - go.h - 5) + 'px; ';
            divStr += 'left: ' + (go.x - go.w - 5) + 'px; ';
            divStr += 'height: ' + go.h + 'px; ';
            divStr += 'width: ' + go.w + 'px;';
            divStr += '\"></div>';
            $('#divDraw').append(divStr);
        }

        // instantiate map
        this.mapSvg[i] = d3.selectAll("#divMap"+i)
            .data([i])
            .append('svg:svg')
            .attr('width',go.w)
            .attr('height',go.h)
            .on('click',function(d) {
                d3.select('#divMap' + d).remove();
            });

        this.mapPo[i] = po.map().container(this.mapSvg[i].append("svg:svg").node())
                            .center({lat: meanLat, lon: meanLon})
                            .zoom(1.5)
                            .add(po.image()
                                .url(po.url(url)
                                .hosts(["a.","b.","c.",""])));
        if (isLegend)
        {
            lgdStr = '<svg width=\"100\" height=\"100\">'
                lgdStr += '<text class=\"text\"; ';
                lgdStr += 'x=' + go.x + ' y=' + go.y + ' '; //x=0 y=0 ';
                lgdStr += 'dx=15 dy=10 ';
                lgdStr += 'fill=\"black\" ';
                lgdStr += 'font-size=\"16\"';
                lgdStr += '>Legend</text></svg>';
                $('#container').append(lgdStr);
        }
    }
    
    console.log("autozoom start\n");
    // autozoom for one, then update all
    var autoZoomSize = 0.25;
    while (minLat < this.mapPo[0].extent()[0].lat) {
        this.mapPo[0].zoomBy(-autoZoomSize);
        if (this.mapPo[0].zoom() <= 1) { this.mapPo[0].center({lat:20,lon:20}); break; }
    }
    while (minLon < this.mapPo[0].extent()[0].lon) {
        this.mapPo[0].zoomBy(-autoZoomSize);
        if (this.mapPo[0].zoom() <= 1) { this.mapPo[0].center({lat:20,lon:20}); break; }
    }
    while (maxLat > this.mapPo[0].extent()[1].lat) {
        this.mapPo[0].zoomBy(-autoZoomSize);
        if (this.mapPo[0].zoom() <= 1) { this.mapPo[0].center({lat:20,lon:20}); break; }
    }
    while (maxLon > this.mapPo[0].extent()[1].lon) {
        this.mapPo[0].zoomBy(-autoZoomSize);
        if (this.mapPo[0].zoom() <= 1) { this.mapPo[0].center({lat:20,lon:20}); break; }
    }
    console.log("autozoom end\n");
    this.mapPo[0].zoomBy(-autoZoomSize);
    var bestZoom = this.mapPo[0].zoom();
    for (var i = 0; i < this.mapPo.length; i++) {
        if (typeof(this.mapPo[i]) !== 'undefined')
            this.mapPo[i].zoom(bestZoom);
    }


};

Bayfig.drawMarkers = function() {
    
    var foci = [];
    var cutoff = this.minareaval; // .07/.76 + 0.08362;
    //var wallace = [0,1,2,3,4,5,6]; var lydekker = [7,8,9];
    //var wallace = [0,1,2,3,4,5,6,7,8,9];
    //var asia = [0,1,2,3,4,5]; var sunda = [45, 6,7,8,9,10,11,12,13,14,15,16,17,18,19]; var wallacea = [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42];

    
    for (var i = 0; i < this.numNodes + 1; i++) {
       
        // for each node
        if (i == this.numNodes)
            var p = this.legendNode;
        else
            var p = this.nodes[i];

        if (typeof(this.mapPo[i]) !== 'undefined') {
       
            // convert to px coords
            for (var j = 0; j < this.geoData.length; j++)
               foci[j] = this.mapPo[i].locationPoint(this.geoData[j]);

            var layer = d3.select("#divMap" + i + " svg");
            layer.selectAll("circle.marker")
                .data(p.area_pp)
              .enter().append("svg:circle")
                .attr("class","marker")
                .attr("cx", function(d,i) {  return foci[i].x; })
                .attr("cy", function(d,i) { return foci[i].y; })
                .attr("r", function(d,i) {
                    if (d > cutoff)
                        return Bayfig.mapheight*0.05;
                    else
                        return 0.0;
                })
                .attr("fill", function(d,i) {
                    return Bayfig.areacolors[Bayfig.areatypes[i]];
                })
                .attr("stroke", "black")
                .attr("fill-opacity", function(d) { return d; });
        }


    }

};


Bayfig.drawLegend = function() {

    var barheight = 30;
    var barwidth = 30;
    var barspace = 25;

/*
    var divStr = ''
    divStr += '<div id=\"divLegend' + i + '\" style=\"';
    divStr += 'position: absolute; ';
    divStr += 'border: 1px solid black; ';
    divStr += 'top: -15px; ';
    divStr += 'left: -10px; ';
    divStr += 'height: ' + ( 30+ (barheight+barspace)*this.areanames.length ) + 'px; ';
    divStr += 'width: ' + ( 20+ this.mapwidth ) + 'px;';
    divStr += '\"></div>';
    $('#divDraw').append(divStr);
*/

    for (var i = 0; i < this.areacolors.length; i++)
    {
        ypos = (barheight+barspace)*i + this.mapheight;
        var svg = d3.select("#container").select("svg")
        var tmpcol = this.areacolors[i]

        var gradient = svg.append("svg:defs")
          .append("svg:linearGradient")
            .attr("id","gradient")
            .attr("x1","0")
            .attr("y1","0")
            .attr("x2","1")
            .attr("y2","0")
            .attr("spreadMethod","pad");

        gradient.append("svg:stop")
            .attr("offset","0%")
            .attr("stop-color",tmpcol)
            .attr("stop-opacity",1);
        
        gradient.append("svg:stop")
            .attr("offset","100%")
            .attr("stop-color","white")
            .attr("stop-opacity",1);

        svg.append("svg:rect")
            .attr("width", this.mapwidth) //barwidth)
            .attr("height", barheight)
            .attr("x", 0)
            .attr("y", ypos)
            .style("fill","url(#gradient)")
            .attr("stroke","black")

        svg.append("svg:text")
            .attr("class","text")
            .attr("x", 0)
            .attr("y", ypos-5)
            .text(this.areanames[i])
            .attr("fill", "black")
            .attr("font-size","16");

        var th = (1-this.minareaval)*this.mapwidth;
        svg.append("svg:line")
            .attr("x1", th)
            .attr("x2", th)
            .attr("y1",ypos)
            .attr("y2",ypos+barheight)
            .style("stroke","black");

    }
   
    svg.append("svg:text")
        .attr("class","text")
        .attr("x", (1-this.minareaval)*this.mapwidth)
        .attr("y", (barheight+barspace)*this.areanames.length + 90)
        .attr("fill", "black")
        .attr("font-size","16")
        .attr("text-anchor","middle")
        .text(this.minareaval);
   /*
    svg.append("svg:text")
        .attr("class","text")
        .attr("x", 0)
        .attr("y", (barheight+barspace)*this.areanames.length + 90)
        .text("1.0")
        .attr("fill", "black")
        .attr("font-size","16");
   
   
    svg.append("svg:text")
        .attr("class","text")
        .attr("x", this.mapwidth)
        .attr("y", (barheight+barspace)*this.areanames.length + 90)
        .text("0.0")
        .attr("fill", "black")
        .attr("font-size","16");
    */
}


d3.select('#buttonReset').on('click', function() {
    console.log("hi")
    d3.select(this)
        .attr('href', 'data:application/octet-stream;base64,' + btoa(d3.select('#divDraw').html()))
        .attr('download', 'viz.svg')
});


/***
UTIL
***/
function trim1 (str)
{
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
