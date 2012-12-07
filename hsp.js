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
	
	touch: [],
	
	screen: function(id, w, h, color)
	{
		hsp.duration_ = 0;
		hsp.x_ = 0;
		hsp.y_ = 0;
		hsp.w_ = 32;
		hsp.h_ = 32;
		hsp.objw_ = 64;
		hsp.objh_ = 24;
		hsp.maintimer_ = null;
		hsp.mainfunc_ = null;

		for( i=0; i<256; i++ )
		{
			hsp.key_[i] = false;
		}

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
		hsp.canvas_.style.cursor = 'default';
		hsp.canvas_.style.margin = 'auto';
		hsp.maindiv_.appendChild( hsp.canvas_ );
		hsp.images_[0] = hsp.canvas_;

		// direct drawing
		hsp.ctx = hsp.canvas_.ctx;
		hsp.font( "monospace", 16 );

		if ( color === undefined ) { color = 'white'; }
		hsp.cls( color );

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
		
		hsp.canvas_.onmousemove = function(e)
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

		hsp.canvas_.onmouseup = function(e)
		{
			switch(e.button)
			{
				case 0: hsp.mouse.l = false; break;
				case 1: hsp.mouse.m = false; break;
				case 2: hsp.mouse.r = false; break;
			}
		};

		hsp.canvas_.onresize = hsp.onresize_;

		hsp.canvas_.onkeydown = function(e)
		{
			hsp.key_[e.keyCode] = true;
			return true;
		};
		
		hsp.canvas_.onkeyup = function(e)
		{
			hsp.key_[e.keyCode] = false;
			return true;
		};

		// for smartphones
		touchfunc = function(e)
		{
			var numTouch = e.touches.length;
			var rect = hsp.canvas_.getBoundingClientRect();
			var ofsx = window.scrollX + rect.left;
			var ofsy = window.scrollY + rect.top;

			hsp.touch.length = 0;
			for( var cnt=0; cnt<numTouch; cnt++ )
			{
				var posx = e.touches[cnt].pageX - ofsx;
				var posy = e.touches[cnt].pageY - ofsy;
				hsp.touch.push( { x: posx, y: posy } );
			}
			hsp.mouse.x = hsp.touch[0].x;
			hsp.mouse.y = hsp.touch[0].y;
			hsp.mouse.l = numTouch;
			e.preventDefault();
		};
		
		hsp.canvas_.ontouchstart = touchfunc;
		hsp.canvas_.ontouchmove = touchfunc;
		hsp.canvas_.ontouchend = function(e) {
			var numTouch = e.touches.length;
			hsp.touch.length = numTouch;
			hsp.mouse.l = numTouch;
			e.preventDefault();
		};
	},

	buffer: function(id, w, h, color)
	{
		var buf = document.createElement('canvas');
		buf.ctx = buf.getContext('2d');
		buf.width  = w;
		buf.height = h;
		buf.style.width  = w;
		buf.style.height = h;
		buf.style.cursor = 'default';
		buf.style.margin = 'auto';
		hsp.images_[id] = buf;
	},
	
	gsel: function(id) {
		hsp.ctx = hsp.images_[id].ctx;
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

	picload: function( id, url )
	{
		var img = new Image();
		img.src = url;
		hsp.images_[id] = img;
	},

	alpha: function( a )
	{
		hsp.ctx.globalAlpha = Math.min( Math.max(a, 0), 256 ) / 256;
	},

	gmode: function( mode, w, h, a )
	{
		switch( mode )
		{
			case 0: mode = 'copy'; break; // warning: undesired clipping. use only with gcopy.
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

	fillTriangle_: function( x0, y0, x1, y1, x2, y2 )
	{
		hsp.ctx.beginPath();
		hsp.ctx.moveTo(x0, y0);
		hsp.ctx.lineTo(x1, y1);
		hsp.ctx.lineTo(x2, y2);
		hsp.ctx.fill();
	},

	fillTexTriangle_: function( im, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2 )
	{
		var eu0 = u1 - u0;
		var eu1 = u2 - u1;
		var eu2 = u0 - u2;
		var ev0 = v1 - v0;
		var ev1 = v2 - v1;
		var ev2 = v0 - v2;
		var c0 = u2*v1 - v2*u1;
		var c1 = u0*v2 - v0*u2;
		var c2 = u1*v0 - v1*u0;
		var invd = 1.0 / (u0*ev1 + u1*ev2 + u2*ev0);

		hsp.ctx.save();
		hsp.ctx.beginPath();
		hsp.ctx.moveTo(x0, y0);
		hsp.ctx.lineTo(x1, y1);
		hsp.ctx.lineTo(x2, y2);
		hsp.ctx.closePath();
		hsp.ctx.clip();

		hsp.ctx.setTransform(
			(x0 * ev1 + x1 * ev2 + x2 * ev0) * invd,
			(y0 * ev1 + y1 * ev2 + y2 * ev0) * invd,
			(x0 * eu1 + x1 * eu2 + x2 * eu0) * -invd,
			(y0 * eu1 + y1 * eu2 + y2 * eu0) * -invd,
			(x0 * c0  + x1 * c1  + x2 * c2 ) * invd,
			(y0 * c0  + y1 * c1  + y2 * c2 ) * invd
		);
		hsp.ctx.drawImage(im, 0, 0);
		hsp.ctx.restore();
	},

	gsquare: function( id, xs, ys, us, vs )
	{
		if ( id < 0 )
		{
			hsp.fillTriangle_( xs[0], ys[0], xs[1], ys[1], xs[2], ys[2] );
			hsp.fillTriangle_( xs[0], ys[0], xs[2], ys[2], xs[3], ys[3] );
		} else {
			hsp.fillTexTriangle_( hsp.images_[id], xs[0], ys[0], xs[1], ys[1], xs[2], ys[2], us[0], vs[0], us[1], vs[1], us[2], vs[2] );
			hsp.fillTexTriangle_( hsp.images_[id], xs[0], ys[0], xs[2], ys[2], xs[3], ys[3], us[0], vs[0], us[2], vs[2], us[3], vs[3] );
		}
	},

	grotate: function( id, u, v, rad, sx, sy )
	{
		if ( sx === undefined ) { sx = hsp.w_; }
		if ( sy === undefined ) { sy = hsp.h_; }
		hsp.ctx.save();
		hsp.ctx.translate(hsp.x_, hsp.y_);
		hsp.ctx.rotate(rad);
		hsp.ctx.translate(sx*-0.5, sy*-0.5);
		if( id>0 )
		{
			hsp.ctx.drawImage( hsp.images_[id], u, v, u+hsp.w_, v+hsp.h_, 0, 0, sx, sy );
		}
		else
		{
			hsp.ctx.fillRect( 0, 0, sx, sy );
		}
		hsp.ctx.restore();
	},

	grect: function( u, v, rad, sx, sy )
	{
		hsp.grotate( -1, u, v, rad, sx, sy );
	},
	
	color: function(r, g, b, a)
	{
		var colstr = 'rgb(' + ~~(r) + ',' + ~~(g) + ',' + ~~(b) + ')';
		hsp.ctx.fillStyle = colstr;
		hsp.ctx.strokeStyle = colstr;
		if ( a !== undefined )
		{
			hsp.ctx.globalAlpha = Math.min( Math.max(a/256, 0), 1 );
		}
	},

	hsvcolor: function(h, s, v, a)
	{
		v = Math.min( Math.max(v, 0), 255 );

		if (h < 0) {
			h = 191 - (~~(-h) % 192);
		} else {
			h = ~~(h) % 192;
		}

		if (s == 0)
		{
			hsp.color( v, v, v, a );
		}
		
		s = Math.min( Math.max(s, 0), 255 ) / 255;
		var i = ~~(h / 32) % 6,
			f = (h / 32) - i,
			p = v * (1 - s),
			q = v * (1 - f * s),
			t = v * (1 - (1 - f) * s)

		switch (i)
		{
		case 0: hsp.color( v, t, p, a ); break;
		case 1: hsp.color( q, v, p, a ); break;
		case 2: hsp.color( p, v, t, a ); break;
		case 3: hsp.color( p, q, v, a ); break;
		case 4: hsp.color( t, p, v, a ); break;
		case 5: hsp.color( v, p, q, a ); break;
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
		var r = Math.abs( x1 - x2 );
		hsp.ctx.save();
		hsp.ctx.translate( ( x1 + x2 ) * 0.5, ( y1 + y2 ) * 0.5 );
		hsp.ctx.scale( 1.0, Math.abs( y1 - y2 ) / r );
		hsp.ctx.beginPath();
		hsp.ctx.arc( 0, 0, r * 0.5, 0, 7, false );
		if ( f || (f === undefined) )
		{
			hsp.ctx.fill();
		} else {
			hsp.ctx.closePath();
			hsp.ctx.stroke();
		}
		hsp.ctx.restore();
	},

	cls: function( color, alpha )
	{
		if ( alpha === undefined ) { alpha = 1; }
		hsp.ctx.save();
		hsp.ctx.globalAlpha = alpha;
		hsp.ctx.fillStyle = color;
		hsp.ctx.fillRect(0, 0, hsp.ginfo.winx, hsp.ginfo.winy);
		hsp.ctx.restore();
        hsp.x_ = 0;
        hsp.y_ = 0;
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
		var lines = msg.split("\n");
		for(var i = 0; i < lines.length; i++ )
		{
			hsp.ctx.fillText(lines[i], hsp.x_, hsp.y_);
			hsp.y_ += hsp.fontsize_;
		}
	},

	rnd: function( lim )
	{
		return ~~( Math.random() * lim );
	},

	rndf: function()
	{
		return Math.random();
	},
	
	distf: function(x, y)
	{
		return Math.sqrt(x*x+y*y)
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

	bsave: function( filename, data )
	{
		localStorage[filename] = JSON.stringify( data )
	},

	bload: function( filename )
	{
		var str = localStorage[filename]
		if ( str === undefined )
		{
			return undefined
		}
		return JSON.parse( str )
	}
}


var http = {
	get: function( url )
	{
		var o = new XMLHttpRequest();
		try {
			o.open('GET', url, false);
			o.send(null);
		} catch(e) {
			return "error"
		}
		return o.responseText;
	},

	request: function( url )
	{
		try {
			var o = new XMLHttpRequest();
			o.open('GET', url, true);
			o.send(null);
		} catch(e) {
			return undefined
		}
		return o;
	},

	stat: function( req )
	{
		if (req === undefined ) return 0;
		return req.readyState;
	},

	result: function( req )
	{
		if (req === undefined ) return "error";
		return req.responseText;
	}
}

