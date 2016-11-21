(function(window, factory) {
	factory(window)
})(window, function(window) {

	/*
	* Initialize a new WB
	* Set points to an empty array
	* Set mouse to a default 0, 0
	* Set mousedown to false
	*/
	var WB = function(element, options) {
		return new WB.init(element, options);
	},
	points = [],
	mouse = {
		x: 0,
		y: 0
	},
	mousedown = false;

	/*
	*	Start up the Whiteboard
	*/
	WB.init = function(element, options) {
		// Set the default options
		var opt = {
			toolbar: false,
			brush: {
				colour: "black",
				size: 3,
				cap: "round",
				join: "round"
			},
			board: {
				fill: "white"
			},
			cursor: "crosshair",
			smoothing: true
		}

		// If options were set, overwrite default opts with given values
		if(options) {
			for(var key in options) {
				opt[key] = options[key];
			}
		}

		// Push the options to the main object
		WB.Options = opt;
		// Make the brush options quickly accessible as Brush
		WB.Brush = opt.brush;

		// Get the container element from the given selector
		var el = document.querySelector(element);

		// If el exists, start up Whiteboard, otherwise warn and return
		if(typeof el !== "undefined") {

			// Set the container to the element for easy access
			WB.Container = el;

			// If the settings call for a toolbar, start up with a toolbar
			if(opt.toolbar) {
				WB.initToolbar();
			}

			// Start up the canvases
			WB.initCanvas();
		} else {
			console.warn("No element found with given selector.");
			return false;
		}

		// Assign the required event listeners, will be adding touch versions in the future
		WB.Board.canvas.addEventListener("mousedown", WB.mousedown, false);
		WB.Board.canvas.addEventListener("mousemove", WB.mousemove, false);
		WB.Board.canvas.addEventListener("mouseup", WB.mouseup, false);
		WB.Board.canvas.addEventListener("click", WB.click, false);
	}

	/*
	* Initialise both canvases.
	* Board is the main canvas where data is displayed permanently as the drawing
	* Ghost is the overlayed second canvas where actions are calculated while drawing, this is cleared after every mouseup/draw end
	* Set up both the contexts and push them to their own WB indexes for later
	*/
	WB.initCanvas = function() {
		var board = document.createElement("canvas"),
			ghost = document.createElement("canvas")
			ctx = board.getContext("2d"),
			gctx = ghost.getContext("2d");

		if(WB.Options.smoothing) ctx.imageSmoothingEnabled = true;

		WB.Board = {
			canvas: board,
			context: ctx
		}

		WB.Ghost = {
			canvas: ghost,
			context: gctx
		}

		var height = WB.Container.offsetHeight,
			width = WB.Container.offsetWidth;

		// If we have a toolbar, knock that much off the height of the canvas so it doesn't cause scrolling
		if(WB.Options.toolbar) {
			height-= WB.Toolbar.offsetHeight;
		}

		WB.fitCanvas(height, width);
		
		board.style.cursor = WB.Options.cursor;

		var top = board.offsetTop,
			left = board.offsetLeft;

		// As above, if we have a toolbar knock this much off the top positioning of the ghost
		if(WB.Options.toolbar) {
			top+= WB.Toolbar.offsetHeight;
		}

		// Absolutely position the Ghost over the Board
		ghost.style.top = top;
		ghost.style.left = left;
		ghost.style.position = "absolute";
		ghost.style.zIndex = 0;
		ghost.style.pointerEvents = "none";

		ctx.fillStyle = WB.Options.board.fill;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		WB.Container.appendChild(board);
		WB.Container.appendChild(ghost);
	}

	/*
	* Build the toolbar
	* Set up some basic styles but mostly left up to the user for now. Default CSS could be added down the line.
	*/
	WB.initToolbar = function() {
		var tbo = WB.Options.toolbar,
			tb = document.createElement("section");

		tb.style.width = "100%";
		tb.style.minHeight = "50px";
		tb.style.display = "flex";
		tb.setAttribute("id", "wb_toolbar");

		// If brushsizes were given, loop through them to create the buttons needed to set the brush size
		if(tbo.brushSize) {
			if(!tbo.brushSize instanceof Array) {
				console.warn("Brush Sizes must be given in an Array");
				return;
			}

			// Callback sets the brush size to the data-wb attribute value.
			WB.toolbarButtons(tb, tbo.brushSize, function() {
				var size = this.getAttribute("data-wb");
				WB.setBrushSize(size);
			});
		}

		// Each toolbar option gets the same setup, if it's not an array we can't use it.
		if(tbo.brushColour) {
			if(!tbo.brushColour instanceof Array) {
				console.warn("Brush colours must be provided as an array of values");
				return;
			}

			WB.toolbarButtons(tb, tbo.brushColour, function() {
				var colour = this.getAttribute("data-wb");
				WB.setBrushColour(colour);
			});
		}

		WB.Container.appendChild(tb);
		WB.Toolbar = tb;
	}

	/*
	* Set up the toolbar buttons. The toolbar can have an optional "style" value assigned with the values of "icon", "text" or "icontext"
	* Buttons are set up appropriately.
	*/
	WB.toolbarButtons = function(toolbar, options, callback, style) {
		var sizeButtons = [];

		for(let i = 0; i < options.length; i++) {
			var sbtn = options[i],
				btn = document.createElement("button");

			/* If the style of the button is an object then it is expected to have the text and icon indexes
			* depending on which is required by the toolbar's style setting.
			*
			* If it is not an object, the value given is used as the innertext
			*/
			if(sbtn instanceof Object) {
				btn.setAttribute("data-wb", sbtn.size);

				if(style == "icons" || style == "texticons") {
					var img = new Image();
						img.src = sbtn.icon;

					btn.appendChild(img);
				}

				if(style == "text" || style == "texticons") {
					btn.innerText = sbtn.text;
				}
			} else {
				btn.setAttribute("data-wb", sbtn);
				btn.innerText = sbtn;
			}

			btn.setAttribute("type", "button");

			// Assign the callback function to the click listener
			btn.addEventListener("click", callback, false)

			toolbar.appendChild(btn);
		}
	}

	/*
	* Fit both canvases to the sizes of the container, with toolbar size already taken into account
	*/
	WB.fitCanvas = function(height, width) {
		WB.Board.canvas.setAttribute("height", height);
		WB.Board.canvas.setAttribute("width", width);
		WB.Ghost.canvas.setAttribute("height", height);
		WB.Ghost.canvas.setAttribute("width", width);
	}

	/*
	* Click listener, currently not functional.
	*/
	WB.click = function(event) {
		event.preventDefault();

		var x = event.offsetX,
			y = event.offsetY;

		mouse.x = x;
		mouse.y = y;

		points.push({ x: x, y: y });

		WB.draw();

		points = [];
	}

	/*
	* Mousedown listener. On mousedown, update the x and y, push to points, set mousedown to true.
	*/
	WB.mousedown = function(event) {
		event.preventDefault();

		var x = event.offsetX,
			y = event.offsetY;

		mouse.x = x;
		mouse.y = y;

		points.push({ x: x, y: y });

		mousedown = true;
	}

	/*
	* Mousemove handler. Return early if not mousedown to save time and energy for all involved.
	* Otherwise updates the x and y, then draws.
	*/
	WB.mousemove = function(event) {
		if(!mousedown) return;
		event.preventDefault();

		var x = event.offsetX,
			y = event.offsetY;

		mouse.x = x;
		mouse.y = y;

		if(mousedown) {
			points.push({ x: x, y: y });
			WB.draw();
		}
	}

	/*
	* Mouseup handler. Draws the contents of the Ghost to the Board, clears the Ghost and resets points and mousedown to defaults.
	*/
	WB.mouseup = function(event) {
		event.preventDefault();
		WB.Board.context.drawImage(WB.Ghost.canvas, 0, 0);
		WB.Ghost.context.clearRect(0, 0, WB.Ghost.canvas.width, WB.Ghost.canvas.height);

		points = [];
		mousedown = false;
	}

	/*
	* Draw to the Ghost.
	*/
	WB.draw = function() {
		// Set up some shorthands
		var gvs = WB.Ghost.canvas,
			gcx = WB.Ghost.context;

		// Clear the Ghost before drawing to it again.
		gcx.clearRect(0, 0, gcx.canvas.width, gcx.canvas.height);

		// If it's only a short list of points we can't quadratic curve it so arc it and return
		if(points.length < 3) {
			var b = points[0];
			gcx.beginPath();
			gcx.arc(b.x, b.y, b.lineWidth / 2, 0, Math.PI * 2, !0);
			gcx.fill();
			gcx.closePath();

			return;
		}

		// Set the stroke styles to match the Brush settings
		gcx.lineCap = WB.Brush.cap;
		gcx.lineJoin = WB.Brush.join;
		gcx.lineWidth = WB.Brush.size;
		gcx.strokeStyle = WB.Brush.colour;

		// Begin the path and move to the location of the first index of the points array
		gcx.beginPath();
		gcx.moveTo(points[0].x, points[0].y);

		// Loop through the points and draw them to the Ghost with a quadratic curve
		for(var i = 1; i < points.length - 2; i++) {
			var c = (points[i].x + points[i + 1].x) / 2,
				d = (points[i].y + points[i + 1].y) / 2;

			gcx.quadraticCurveTo(points[i].x, points[i].y, c, d);
		}

		// Finish the quadratic curve outside the loop, then stroke the line
		// Found issues if the last curveTo was called within the loop
		// This solved it
		// Don't ask me why
		gcx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);

		gcx.stroke();

		// If there are a large number of points being stored and looped through we need to cut a few off to save memory
		// Draw it to the Board and push the newpoints back to points with a few trimmed out.
		// Found that holding mousedown and drawing without this become unmanageable even with the Ghost
		if(points.length > 100) {
			WB.Board.context.drawImage(WB.Ghost.canvas, 0, 0);
			var newPoints = [];

			for(var i = points.length - 10; i < points.length; i++) {
				newPoints.push({ x: points[i].x, y: points[i].y });
			}

			points = newPoints;
		}
	}

	WB.setBrushSize = function(size) {
		if(isNaN(size)) return;

		WB.Brush.size = size;
	}

	WB.setBrushColour = function(colour) {
		if(typeof colour !== "string") return;

		WB.Brush.colour = colour;
	}

	WB.setLineCap = function(cap) {
		if(typeof cap !== "string") return;

		WB.Brush.cap = cap;
	}

	WB.getContentData = function() {
		return WB.Board.canvas.toDataURL();
	}

	window.Whiteboard = window.WB = WB;
})