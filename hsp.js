/*
Copyright (c) 2012 MIA

(MIT license)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var hsp = {
	key_: [],
	mmslot_: [],
	images_: [],

	ginfo: {
		winx: 0,
		winy: 0,
	},

	mouse: {
		x: null,
		y: null,
		l: false,
		m: false,
		r: false,
	},
	

	screen: function(id, w, h)
	{
		hsp.duration_ = 0;
		hsp.last_redraw_ = 0;
		hsp.x_ = 0;
		hsp.y_ = 0;
		hsp.w_ = 32;
		hsp.h_ = 32;
		hsp.objw_ = 64;
		hsp.objh_ = 24;
		hsp.fontsize_ = 16;
		hsp.fontface_ = "sans-serif";
		hsp.maintimer_ = null;
		hsp.mainfunc_ = null;

		hsp.maindiv_ = document.getElementById(id);
		hsp.maindiv_.width = w;
		hsp.maindiv_.height = h;
		hsp.maindiv_.style.width = w;
		hsp.maindiv_.style.height = h;
		hsp.maindiv_.style.textAlign = 'left';
		hsp.maindiv_.style.cursor = 'default';

		// set ginfo
		var rect = hsp.maindiv_.getBoundingClientRect();
		w = rect.right - rect.left;
		h = rect.bottom - rect.top;

		hsp.ginfo.winx = w;
		hsp.ginfo.winy = h;

		// ui surface
		hsp.ui_ = document.createElement('div');
		hsp.maindiv_.appendChild(hsp.ui_);

		// display surface
		hsp.canvas_ = document.createElement('canvas');
		hsp.canvas_.ctx = hsp.canvas_.getContext('2d');
		hsp.canvas_.width  = w;
		hsp.canvas_.height = h;
		hsp.canvas_.style.width  = w;
		hsp.canvas_.style.height = h;
		hsp.canvas_.style.border = "1px solid white";
		hsp.canvas_.style.cursor = 'default';
		hsp.maindiv_.appendChild( hsp.canvas_ );

		// off-screen surface
		hsp.buffer_ = document.createElement('canvas');
		hsp.buffer_.ctx = hsp.buffer_.getContext('2d');
		hsp.buffer_.width  = w;
		hsp.buffer_.height = h;
		hsp.buffer_.style.width  = w;
		hsp.buffer_.style.height = h;

		// direct drawing
		hsp.ctx = hsp.canvas_.ctx;

		// add event handlers
		hsp.canvas_.onmousedown = function(e)
		{
			switch(e.button)
			{
				case 0: hsp.mouse.l = true; break;
				case 1: hsp.mouse.m = true; break;
				case 2: hsp.mouse.r = true; break;
			}
			// prevent selection on canvas
			return false;
		};
		
		window.onmousemove = function(e)
		{
			var rect = hsp.canvas_.getBoundingClientRect();
			var posx = e.clientX;
			var posy = e.clientY;
			posx += document.documentElement.scrollLeft;
			posy += document.documentElement.scrollTop;
			posx -= rect.left;
			posy -= rect.top;
			hsp.mouse.x = posx;
			hsp.mouse.y = posy;
		};

		window.onmouseup = function(e)
		{
			switch(e.button)
			{
				case 0: hsp.mouse.l = false; break;
				case 1: hsp.mouse.m = false; break;
				case 2: hsp.mouse.r = false; break;
			}
		};

		window.onresize = hsp.onresize_;

		for( i=0; i<256; i++ )
		{
			hsp.key_[i] = false;
		}

		window.onkeydown = function(event)
		{
			hsp.key_[event.keyCode] = true;
			return true;
		};
		
		window.onkeyup = function(event)
		{
			hsp.key_[event.keyCode] = false;
			return true;
		};

		// for iPhone, iPad
		hsp.canvas_.ontouchstart = function(event)
		{
			hsp.mouse.l = true;
			event.preventDefault();
			return false;
		};

		window.ontouchmove = function(event)
		{
			var rect = hsp.canvas_.getBoundingClientRect();
			var posx = event.touches[0].pageX;
			var posy = event.touches[0].pageY;
			posx += document.documentElement.scrollLeft;
			posy += document.documentElement.scrollTop;
			posx -= rect.left;
			posy -= rect.top;
			hsp.mouse.x = posx;
			hsp.mouse.y = posy;
			event.preventDefault();
			return false;
		};

		window.ontouchend = function(event)
		{
			event.preventDefault();
			hsp.mouse.l = false;
			return false;
		};
	},

	main_caller_: function()
	{
		// do something if needed
		hsp.mainfunc_();
	},

	setmain: function( f, w )
	{
		clearInterval(hsp.maintimer_);
		hsp.duration_ = w;
		if ( f !== undefined )
		{
			hsp.mainfunc_ = f;
			hsp.maintimer_ = setInterval( hsp.main_caller_, w );
		}
	},

	redraw: function( type )
	{
		if ( type == 0 )
		{
			hsp.ctx = hsp.buffer_.ctx;
			if ( hsp.last_redraw_ == 0 ) { return; }
			hsp.buffer_.ctx.putImageData( hsp.canvas_.ctx.getImageData( 0, 0, hsp.ginfo.winx, hsp.ginfo.winy ), 0, 0 );
		}
		if ( type == 1 )
		{
			if ( hsp.last_redraw_ != 0 ) { return; }
			hsp.canvas_.ctx.putImageData( hsp.buffer_.ctx.getImageData( 0, 0, hsp.ginfo.winx, hsp.ginfo.winy ), 0, 0 );
			hsp.ctx = hsp.canvas_.ctx;
		}
		hsp.last_redraw_ = type;
	},

	picload: function( id, url )
	{
		var img = new Image();
		img.src = url;
		hsp.images_[id] = img;
	},

	alpha: function( a )
	{
		hsp.ctx.globalAlpha = a / 256;
	},

	gmode: function( mode, w, h, a )
	{
		switch( mode )
		{
			case 0: mode = 'copy'; break;
			case 1: mode = 'source-over'; break;
			case 2: mode = 'source-over'; break;
			case 3: mode = 'source-over'; break;
			case 4: mode = 'source-over'; break;
			case 5: mode = 'lighter'; break;
			case 6: mode = 'darker'; break;
		}
		hsp.ctx.globalCompositeOperation = mode;
		if ( w !== undefined ) { hsp.w_ = w; }
		if ( h !== undefined ) { hsp.h_ = h; }
		if ( a !== undefined ) { hsp.ctx.globalAlpha = a / 256; }
	},

	gcopy: function( id, x, y, w, h )
	{
		if ( w === undefined )
		{
			w = hsp.w_;
			h = hsp.h_;
		}
		hsp.ctx.drawImage( hsp.images_[id], x, y, w, h, hsp.x_, hsp.y_, w, h);
	},

	color: function(r, g, b, a)
	{
		var colstr = 'rgb(' + ~~(r) + ',' + ~~(g) + ',' + ~~(b) + ')';
		hsp.ctx.fillStyle = colstr;
		hsp.ctx.strokeStyle = colstr;
		if ( a !== undefined ) { hsp.ctx.globalAlpha = a / 256; }
	},

	hsvcolor: function( h, s, v )
	{
		v = Math.min( Math.max(v, 0), 255 );

		if (h < 0) {
			h = 192 - (~~(-h) % 192);
		} else {
			h = ~~(h) % 192;
		}

		if (s == 0)
		{
			hsp.color( v, v, v );
		}
		
		s = Math.min( Math.max(s, 0), 255 ) / 255;
		var i = (~~(h) / 32) % 6,
			f = (h / 32) - i,
			p = v * (1 - s),
			q = v * (1 - f * s),
			t = v * (1 - (1 - f) * s)

		switch (i)
		{
		case 0: hsp.color( v, t, p ); break;
		case 1: hsp.color( q, v, p ); break;
		case 2: hsp.color( p, v, t ); break;
		case 3: hsp.color( p, q, v ); break;
		case 4: hsp.color( t, p, v ); break;
		case 5: hsp.color( v, p, q ); break;
		}
	},

	pos: function(x, y)
	{
		hsp.x_ = x;
		hsp.y_ = y;
	},

	line: function( x1, y1, x2, y2 )
	{
		hsp.ctx.beginPath();
		if ( x2 !== undefined )
		{
			hsp.ctx.moveTo(x1, y1);
			hsp.ctx.lineTo(x2, y2);
			hsp.x_ = x2;
			hsp.y_ = y2;
		}
		else
		{
			hsp.ctx.moveTo(hsp.x_, hsp.y_);
			hsp.ctx.lineTo(x1, y1);
			hsp.x_ = x1;
			hsp.y_ = y1;
		}
		hsp.ctx.closePath();
		hsp.ctx.stroke();
	},

	circle: function(x1, y1, x2, y2, f)
	{
		var hw = (x2 - x1) * 0.5;
		var hh = (y2 - y1) * 0.5;
		var cx = x1 + hw;
		var cy = y1 + hh;
		var cw = 0.5522847498308 * hw; // 0.552... =  (sqrt(2)-1) * 4 / 3
		var ch = 0.5522847498308 * hh;

		hsp.ctx.beginPath();
		hsp.ctx.moveTo(cx, y1);
		hsp.ctx.bezierCurveTo(cx + cw, y1,  x2, cy - ch,  x2, cy);
		hsp.ctx.bezierCurveTo(x2, cy + ch,  cx + cw, y2,  cx, y2);
		hsp.ctx.bezierCurveTo(cx - cw, y2,  x1, cy + ch,  x1, cy);
		hsp.ctx.bezierCurveTo(x1, cy - ch,  cx - cw, y1,  cx, y1);
		if ( f || (f === undefined) )
		{
			hsp.ctx.fill();
		}
		else
		{
			hsp.ctx.stroke();
		}
	},

	cls: function( color )
	{
		hsp.ctx.save();
		hsp.ctx.fillStyle = color;
		hsp.ctx.beginPath();
		hsp.ctx.fillRect(0, 0, hsp.ginfo.winx, hsp.ginfo.winy);
		hsp.ctx.restore();
	},

	getkey: function( k )
	{
		if (hsp.key_[k])
		{
			return 1;
		}
		else
		{
			return 0;
		}
	},

	boxf: function( x1, y1, x2, y2 )
	{
		if ( x1 === undefined ) { x1 = 0; }
		if ( y1 === undefined ) { y1 = 0; }
		if ( x2 === undefined ) { x2 = hsp.ginfo.winx-1; }
		if ( y2 === undefined ) { y2 = hsp.ginfo.winy-1; }
		hsp.ctx.beginPath();
		hsp.ctx.fillRect(x1, y1, x2-x1+1, y2-y1+1);
	},

	font: function( name, size )
	{
		hsp.fontsize_ = size;
		hsp.fontface_ = name;
		hsp.ctx.font = size + "px " + name;
	},

	mes: function( msg )
	{
		hsp.ctx.textBaseline = "top";
        hsp.ctx.fillText(msg, hsp.x_, hsp.y_);
	},

	rnd: function( lim )
	{
		return ~~( Math.random() * lim );
	},

	objsize: function(x, y)
	{
		hsp.objw_ = x;
		hsp.objh_ = y;
	},

	button: function( msg, func )
	{
		var btn = document.createElement('input');
		btn.type = "button";
		btn.value = msg;
		btn.addEventListener('click', func);
		hsp.set_elem_( btn );
		return btn;
	},

	input: function( msg )
	{
		var btn = document.createElement('input');
		btn.type = "text";
		btn.value = msg;
		hsp.set_elem_( btn );
		return btn;
	},

	chkbox: function( msg, value )
	{
		var label = document.createElement('label');
		var btn   = document.createElement('input');

		btn.type  = "checkbox";
		btn.value = value;

		label.style.fontSize = hsp.fontsize_ + "px";
		label.style.fontFace = hsp.fontface_;
		label.appendChild( btn );
		label.appendChild( document.createTextNode(msg) );
		hsp.set_elem_( label );
		return btn;
	},

	clrobj: function()
	{
		if ( hsp.ui_ )
		{
			var elems = hsp.ui_.getElementsByTagName('input');
			while( elems.length > 0 )
			{
				hsp.ui_.removeChild(elems[0]);
			}
		}
	},

	onresize_: function()
	{
		var rect = hsp.ui_.getBoundingClientRect();
		var elems = hsp.ui_.getElementsByTagName('input');
		var i = 0
		while( elems.length > i )
		{
			var elem = elems[i];
			elem.style.left = elem.ox + rect.left;
			elem.style.top  = elem.oy + rect.top;
			i++
		}

		var rect = hsp.canvas_.getBoundingClientRect();
		hsp.ginfo.winx = rect.right - rect.left;
		hsp.ginfo.winy = rect.bottom - rect.top;
	},

	set_elem_: function( elem )
	{
		if ( hsp.ui_ )
		{
			var rect = hsp.ui_.getBoundingClientRect();
			elem.style.display	= 'block';
			elem.style.position	= 'absolute';
			elem.style.left		= hsp.x_ + rect.left;
			elem.style.top		= hsp.y_ + rect.top;
			elem.style.width	= hsp.objw_;
			elem.style.height	= hsp.objh_;
			elem.ox = hsp.x_;
			elem.oy = hsp.y_;
			hsp.ui_.appendChild(elem);
			hsp.y_ += hsp.objh_;
		}
	},

	limitf: function( v, b1, b2 )
	{
		if ( v < b1 ) { v = b1 }
		if ( v > b2 ) { v = b2 }
		return v;
	},

	limit: function( v, b1, b2 )
	{
		return ~~( limitf( v, b1, b2 ) );
	},

	mmload: function( file, id, flag )
	{
		var a = new Audio(file);
		if ( flag & 1 ) { a.loop = true; }
		hsp.mmslot_[id] = a;
		return a;
	},

	mmplay: function( id )
	{
		hsp.mmstop( id );
		hsp.mmslot_[id].play();
	},

	mmstop: function( id )
	{
		var se = hsp.mmslot_[id];
		if ( !se.ended )
		{
			se.pause();
			se.currentTime = 0;
		}
	},

	gosub: function( f )
	{
		f();
	},


}

