/*
Copyright (c) 2012-2013 MIA

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
		cx: 0,
		cy: 0,
		r: 0,
		g: 0,
		b: 0,
		a: 0,
		sel: 0
	},
	
	sensor: {
		gravity:  { x: 0, y: 0, z: 0 },
		accel:    { x: 0, y: 0, z: 0 },
		rotation: { x: 0, y: 0, z: 0 }
	},

	mouse: {
		x: 0,
		y: 0,
		l: false,
		m: false,
		r: false
	},
	
	touch: [],
	
	screen: function(id, w, h, color)
	{
		if( hsp.maintimer !== undefined )
		{
			clearInterval(hsp.maintimer_);
		}

		hsp.w_ = 32;
		hsp.h_ = 32;
		hsp.objw_ = 64;
		hsp.objh_ = 24;
		hsp.maintimer_ = null;
		hsp.mainfunc_ = null;
		hsp.maincnt_ = 0;
		hsp.iid = new Date();
		hsp.zoom_ = 1;

		hsp.errorAlert = true;		
		hsp.enableSound = true;
		hsp.loading = 0;

		for( i=0; i<256; i++ )
		{
			hsp.key_[i] = false;
		}

		hsp.maindiv_ = document.getElementById(id);
		hsp.maindiv_.style.width = typeof(w) == 'number' ? w + 'px' : w;
		hsp.maindiv_.style.height = typeof(h) == 'number' ? h + 'px' : h;
		hsp.maindiv_.style.textAlign = 'left';
		hsp.maindiv_.style.cursor = 'default';
		// set ginfo
		var rect = hsp.maindiv_.getBoundingClientRect();
		w = rect.right - rect.left;
		h = rect.bottom - rect.top;

		hsp.ginfo.winx = w;
		hsp.ginfo.winy = h;
		hsp.ginfo.a = 255;

		// ui surface
		if (hsp.ui_) hsp.maindiv_.removeChild(hsp.ui_);
		hsp.ui_ = document.createElement('div');
		hsp.maindiv_.appendChild(hsp.ui_);

		// display surface
		if (hsp.canvas_) hsp.maindiv_.removeChild(hsp.canvas_);
		hsp.canvas_ = document.createElement('canvas');
		hsp.canvas_.ctx = hsp.canvas_.getContext('2d');
		hsp.canvas_.width  = w;
		hsp.canvas_.height = h;
		hsp.canvas_.style.width  = w + 'px';
		hsp.canvas_.style.height = h + 'px';
		hsp.canvas_.style.cursor = 'default';
		hsp.canvas_.style.margin = 'auto';
		hsp.maindiv_.appendChild( hsp.canvas_ );

		hsp.images_[0] = hsp.canvas_;
		hsp.ctx = hsp.canvas_.ctx;
		hsp.ginfo.sel = 0;
		hsp.font( "monospace", 16 );

		if ( color === undefined ) { color = 'white'; }
		hsp.cls( color );

		// add event handlers
		hsp.canvas_.onmousedown = function(e)
		{
			switch(e.button)
			{
				case 0: hsp.mouse.l = 1; break;
				case 1: hsp.mouse.m = 1; break;
				case 2: hsp.mouse.r = 1; break;
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
			hsp.mouse.x = posx / hsp.zoom_;
			hsp.mouse.y = posy / hsp.zoom_;
		};

		hsp.canvas_.onmouseup = function(e)
		{
			switch(e.button)
			{
				case 0: hsp.mouse.l = 0; break;
				case 1: hsp.mouse.m = 0; break;
				case 2: hsp.mouse.r = 0; break;
			}
		};

		hsp.canvas_.onresize = hsp.onresize_;

		window.onerror = function(e, u, l)
		{
			if( hsp.errorAlert )
			{
				alert( u + "(" + l + "):\n" + e );
				hsp.errorAlert = false;
			}
		};

		window.onkeydown = function(e)
		{
			hsp.key_[e.keyCode] = true;
			return true;
		};
		
		window.onkeyup = function(e)
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
			hsp.mouse.x = hsp.touch[0].x / hsp.zoom_;
			hsp.mouse.y = hsp.touch[0].y / hsp.zoom_;
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
	
		window.ondevicemotion = function(e) {
			hsp.sensor.gravity = e.accelerationIncludingGravity;
			hsp.sensor.accel = e.acceleration;
			if ( e.rotationRate )
			{
				hsp.sensor.rotation.x = e.rotationRate.alpha;
				hsp.sensor.rotation.y = e.rotationRate.beta;
				hsp.sensor.rotation.z = e.rotationRate.gamma;
			}
		};
	},
	
	scrzoom: function( z )
	{
		var w = hsp.ginfo.winx;
		var h = hsp.ginfo.winy;
		hsp.maindiv_.style.width = w * z;
		hsp.maindiv_.style.height = h * z;
		hsp.canvas_.style.width  = w * z;
		hsp.canvas_.style.height = h * z;
		hsp.zoom_ = z;
	},

	buffer: function(id, w, h, color)
	{
		if ( w === undefined ) w = 1;
		if ( h === undefined ) h = 1;
		var buf = document.createElement('canvas');
		buf.ctx = buf.getContext('2d');
		buf.width  = w;
		buf.height = h;
		hsp.images_[id] = buf;
		hsp.gsel(id);
	},
	
	gsel: function(id)
	{
		var img = hsp.images_[id];
		hsp.ginfo.sel = id;
		hsp.ctx = img.ctx;
		hsp.ginfo.winx = img.width;
		hsp.ginfo.winy = img.height;	
	},
	
	main_caller_: function()
	{
		// do something if needed
		hsp.mainfunc_(hsp.maincnt_);
		hsp.maincnt_++;
	},

	setmain: function( f, w )
	{
		clearInterval(hsp.maintimer_);
		if ( f !== undefined )
		{
			hsp.mainfunc_ = f;
			hsp.maintimer_ = setInterval( hsp.main_caller_, w );
			hsp.maincnt_ = 0;
		}
	},

	picload: function( url, ow, cb )
	{
		// latch states
		var dest = hsp.images_[hsp.ginfo.sel];
		var img = new Image();
		var x = hsp.ginfo.cx;
		var y = hsp.ginfo.cy;
		var iid = hsp.iid;

		var cbfunc = function()
		{
			if ( iid != hsp.iid ) return;
			if ( ( ow === undefined ) || ( ow == 0 ) )
			{
				dest.width  = img.width;
				dest.height = img.height;
				x = 0;
				y = 0;
			}
			if ( cb )
			{
				cb( dest.ctx, img, x, y );
			}
			else
			{
				dest.ctx.drawImage( img, x, y );
			}
			hsp.loading--;
		}

		hsp.loading++;
		img.src = url;
		if( img.complete ) {
			cbfunc();
		} else {
			img.onload = cbfunc;
		}
		return img;
	},

	alpha: function( a )
	{
		if ( a !== undefined )
		{
			var ia = Math.min( Math.max(~~a, 0), 255 );
			hsp.ctx.globalAlpha = ia / 255;
			hsp.ginfo.a = ia;
		}
	},

	gmode: function( mode, w, h, a )
	{
		switch( mode )
		{
			case 0: mode = 'source-over'; break;
			case 1: mode = 'source-over'; break;
			case 2: mode = 'source-over'; break;
			case 3: mode = 'source-over'; break;
			case 4: mode = 'source-over'; break;
			case 5: mode = 'lighter'; break;
			case 6: mode = 'darker'; break;
			case -1: mode = 'destination-out'; break;
		}
		hsp.ctx.globalCompositeOperation = mode;
		if ( w !== undefined ) { hsp.w_ = w; }
		if ( h !== undefined ) { hsp.h_ = h; }
		hsp.alpha(a);
	},
	
	gerase: function( x, y, w, h )
	{
		if ( x === undefined ) x = 0
		if ( y === undefined ) y = 0
		if ( w === undefined ) w = hsp.ginfo.winx
		if ( h === undefined ) h = hsp.ginfo.winy
		hsp.ctx.save();
		hsp.ctx.globalCompositeOperation = 'destination-out';
		hsp.ctx.globalAlpha = 1;
		hsp.ctx.fillRect( x, y, w, h );
		hsp.ctx.restore();
	},

	gzoom: function( dx, dy, id, x, y, w, h )
	{
		if ( w === undefined ) w = hsp.w_;
		if ( h === undefined ) h = hsp.h_;
		if ( ( w <= 0 ) || ( h <= 0 ) ) return;
		hsp.ctx.drawImage( hsp.images_[id],
			x, y, w, h, hsp.ginfo.cx, hsp.ginfo.cy, dx, dy);
	},

	gcopy: function( id, x, y, w, h )
	{
		hsp.gzoom( w, h, id, x, y, w, h );
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
/*
		var umin = Math.min( u0, u1, u2 );
		var vmin = Math.min( v0, v1, v2 );
		var umax = Math.max( u0, u1, u2 );
		var vmax = Math.max( v0, v1, v2 );
		var w = umax - umin;
		var h = vmax - vmin;
		hsp.ctx.drawImage(im, umin, vmin, w, h, umin, vmin, w, h);
*/
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
			hsp.fillTexTriangle_( hsp.images_[id],
				xs[0], ys[0], xs[1], ys[1], xs[2], ys[2],
				us[0], vs[0], us[1], vs[1], us[2], vs[2] );
			hsp.fillTexTriangle_( hsp.images_[id],
				xs[0], ys[0], xs[2], ys[2], xs[3], ys[3],
				us[0], vs[0], us[2], vs[2], us[3], vs[3] );
		}
	},

	grotate: function( id, u, v, rad, sx, sy )
	{
		if ( sx === undefined ) { sx = hsp.w_; }
		if ( sy === undefined ) { sy = hsp.h_; }
		hsp.ctx.save();
		hsp.ctx.translate(hsp.ginfo.cx, hsp.ginfo.cy);
		hsp.ctx.rotate(rad);
		hsp.ctx.translate(sx*-0.5, sy*-0.5);
		if( id>0 )
		{
			hsp.ctx.drawImage( hsp.images_[id], u, v, hsp.w_, hsp.h_, 0, 0, sx, sy );
		}
		else
		{
			hsp.ctx.fillRect( 0, 0, sx, sy );
		}
		hsp.ctx.restore();
	},

	grect: function( x, y, rad, sx, sy )
	{
		hsp.ctx.save();
		hsp.ctx.translate( x, y );
		hsp.ctx.rotate(rad);
		hsp.ctx.translate(sx*-0.5, sy*-0.5);
		hsp.ctx.fillRect( 0, 0, sx, sy );
		hsp.ctx.restore();
	},
	
	color: function(r, g, b, a)
	{
		var colstr = 'rgb(' + ~~(r) + ',' + ~~(g) + ',' + ~~(b) + ')';
		hsp.ctx.fillStyle = colstr;
		hsp.ctx.strokeStyle = colstr;
		hsp.ginfo.r = r;
		hsp.ginfo.g = g;
		hsp.ginfo.b = b;
		hsp.alpha(a);
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
		hsp.ginfo.cx = x;
		hsp.ginfo.cy = y;
	},

	line: function( x1, y1, x2, y2 )
	{
		hsp.ctx.beginPath();
		if ( x2 !== undefined )
		{
			hsp.ctx.moveTo(x1, y1);
			hsp.ctx.lineTo(x2, y2);
			hsp.ginfo.cx = x2;
			hsp.ginfo.cy = y2;
		}
		else
		{
			hsp.ctx.moveTo(hsp.ginfo.cx, hsp.ginfo.cy);
			hsp.ctx.lineTo(x1, y1);
			hsp.ginfo.cx = x1;
			hsp.ginfo.cy = y1;
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
		hsp.circler( 0, 0, r*0.5, f )
		hsp.ctx.restore();
	},
	
	circler: function( x, y, r, f )
	{
		hsp.ctx.beginPath();
		hsp.ctx.arc( x, y, r, 0, 7, false );
		if ( f || (f === undefined) )
		{
			hsp.ctx.fill();
		} else {
			hsp.ctx.closePath();
			hsp.ctx.stroke();
		}
	},

	cls: function( color, alpha )
	{
		if ( alpha === undefined ) { alpha = 1; }
		hsp.ctx.save();
		hsp.ctx.globalAlpha = alpha;
		hsp.ctx.fillStyle = color;
		hsp.ctx.fillRect(0, 0, hsp.ginfo.winx, hsp.ginfo.winy);
		hsp.ctx.restore();
		hsp.ginfo.cx = 0;
		hsp.ginfo.cy = 0;
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
	
	gradf: function( x1, y1, x2, y2, mode, c1, c2 )
	{
		var g = hsp.ctx.createLinearGradient(mode ? 0 : x1, mode ? y1 : 0, mode ? 0 : x2, mode ? y2 : 0);
		g.addColorStop(0, c1);
		g.addColorStop(1, c2);
		hsp.ctx.fillStyle = g;
		hsp.ctx.fillRect(x1, y1, x2-x1+1, y2-y1+1);
	},

	rectf: function( x, y, w, h )
	{
		hsp.ctx.fillRect(x, y, w, h);
	},

	pset: function( x, y )
	{
		if ( x === undefined ) { x = hsp.ginfo.cx; }
		if ( y === undefined ) { y = hsp.ginfo.cy; }
		hsp.ginfo.cx = x;
		hsp.ginfo.cy = y;
		hsp.ctx.fillRect(x, y, 1, 1);
	},
	
	pget: function( x, y )
	{
		var t = hsp.ctx.getImageData( x, y, 1, 1 ).data;
		hsp.color( t[0], t[1], t[2], t[3] );
	},

	font: function( name, size, attr )
	{
		var fstr = "";
		if ( attr & 1 ) fstr += "bold ";
		if ( attr & 2 ) fstr += "italic ";
		hsp.fontsize_ = size;
		hsp.fontface_ = name;
		hsp.ctx.font = fstr + " " + size + "px '" + name + "'";
	},

	mes: function( msg )
	{
		hsp.ctx.textBaseline = "top";
		var lines = msg.split("\n");
		for(var i = 0; i < lines.length; i++ )
		{
			hsp.ctx.fillText(lines[i], hsp.ginfo.cx, hsp.ginfo.cy);
			hsp.ginfo.cy += hsp.fontsize_;
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
			elem.style.left		= hsp.ginfo.cx + rect.left;
			elem.style.top		= hsp.ginfo.cy + rect.top;
			elem.style.width	= hsp.objw_;
			elem.style.height	= hsp.objh_;
			elem.ox = hsp.ginfo.cx;
			elem.oy = hsp.ginfo.cy;
			hsp.ui_.appendChild(elem);
			hsp.ginfo.cy += hsp.objh_;
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
		if ( !hsp.enableSound ) return;
		var cbfunc = function() {
			if ( iid != hsp.iid ) return;
			hsp.loading--;
		}
		
		var a = new Audio(file);
		if( a.complete ) {
			cbfunc();
		} else {
			a.onload = cbfunc;
		}
		if ( flag & 1 ) { a.loop = true; }
		hsp.mmslot_[id] = a;
		return a;
	},

	mmplay: function( id )
	{
		if ( !hsp.enableSound ) return;
		var se = hsp.mmslot_[id];
		se.play();
		hsp.mmslot_[id] = new Audio( se.src );
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
	},
	
	bexist: function( filename )
	{
		return ( undefined !== localStorage[filename] )
	},
	
	bdelete: function( filename )
	{
		delete(localStorage[filename])
	},
	
	gencode: function( format )
	{
		return hsp.images_[ hsp.ginfo.sel ].toDataURL( format );
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

