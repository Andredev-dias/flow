import { Styles } from './Styles.js';
import { Serializer } from './Serializer.js';
import { toPX, draggableDOM, dispatchEventList } from './Utils.js';
import { Link } from './Link.js';

let selected = null;

export class Element extends Serializer {

	constructor( draggable = false ) {

		super();

		const dom = document.createElement( 'f-element' );
		dom.element = this;

		const onSelect = ( e ) => {

			let element = this;

			if ( e.changedTouches && e.changedTouches.length > 0 ) {

				const touch = e.changedTouches[ 0 ];

				let overDOM = document.elementFromPoint( touch.clientX, touch.clientY );

				while ( overDOM && ( ! overDOM.element || ! overDOM.element.isElement ) ) {

					overDOM = overDOM.parentNode;

				}

				element = overDOM ? overDOM.element : null;

			}

			selected = element;

		};

		if ( draggable === false ) {

			dom.ontouchstart = dom.onmousedown = ( e ) => {

				e.stopPropagation();

			};

		}

		dom.addEventListener( 'mouseup', onSelect, true );
		dom.addEventListener( 'touchend', onSelect );

		this.inputs = [];

		this.links = [];

		this.dom = dom;

		this.lioLength = 0;
		this.rioLength = 0;

		this.events = {
			'connect': [],
			'connectChildren': []
		};

		this.node = null;

		this.style = '';

		this.extra = null;

		this.enabledInputs = true;

		this.visible = true;

		this.inputsDOM = dom;

		this.disconnectDOM = null;

		this.lioDOM = this._createIO( 'lio' );
		this.rioDOM = this._createIO( 'rio' );

		this.dom.classList.add( `input-${ Link.InputDirection }` );

		this.dom.appendChild( this.lioDOM );
		this.dom.appendChild( this.rioDOM );

		this.addEventListener( 'connect', ( ) => {

			dispatchEventList( this.events.connect, this );

		} );

		this.addEventListener( 'connectChildren', ( ) => {

			dispatchEventList( this.events.connectChildren, this );

		} );

	}

	setAttribute( name, value ) {
		
		this.dom.setAttribute( name, value );
		
		return this;
		
	}

	onConnect( callback, childrens = false ) {

		this.events.connect.push( callback );

		if ( childrens ) {

			this.events.connectChildren.push( callback );

		}

		return this;

	}

	setExtra( value ) {

		this.extra = value;

		return this;

	}

	getExtra() {

		return this.extra;

	}

	setVisible( value ) {

		this.visible = value;

		this.dom.style.display = value ? '' : 'none';

		return this;

	}

	getVisible() {

		return this.visible;

	}

	setEnabledInputs( value ) {

		const dom = this.dom;

		if ( !this.enabledInputs ) dom.classList.remove( 'inputs-disable');

		if ( !value ) dom.classList.add( 'inputs-disable' );

		this.enabledInputs = value;

		return this;

	}

	getEnabledInputs() {

		return this.enabledInputs;

	}

	setStyle( style ) {

		const dom = this.dom;

		if ( this.style ) dom.classList.remove( this.style );

		if ( style ) dom.classList.add( style );

		this.style = style;

		return this;

	}

	setInput( length ) {

		if ( Link.InputDirection === 'left' ) {

			return this.setLIO( length );

		} else {

			return this.setRIO( length );

		}

	}

	setOutput( length ) {

		if ( Link.InputDirection === 'left' ) {

			return this.setRIO( length );

		} else {

			return this.setLIO( length );

		}

	}

	get inputLength() {

		if ( Link.InputDirection === 'left' ) {

			return this.lioLength;

		} else {

			return this.rioLength;

		}

	}

	get outputLength() {

		if ( Link.InputDirection === 'left' ) {

			return this.rioLength;

		} else {

			return this.lioLength;

		}

	}

	setLIO( length ) {

		this.lioLength = length;

		this.lioDOM.style.visibility = length > 0 ? '' : 'hidden';

		return this;

	}

	setRIO( length ) {

		this.rioLength = length;

		this.rioDOM.style.visibility = length > 0 ? '' : 'hidden';

		return this;

	}

	add( input ) {

		this.inputs.push( input );

		input.element = this;

		this.inputsDOM.appendChild( input.dom );

		return this;

	}

	setHeight( val ) {

		this.dom.style.height = toPX( val );

		return this;

	}

	getHeight() {

		return this.dom.style.height;

	}

	connect( element = null ) {

		if ( this.disconnectDOM !== null ) {

			// remove the current input

			this.disconnectDOM.dispatchEvent( new Event( 'disconnect' ) );

		}

		if ( element !== null ) {

			const link = new Link( this, element );

			this.links.push( link );

			if ( this.disconnectDOM === null ) {

				this.disconnectDOM = document.createElement( 'f-disconnect' );
				this.disconnectDOM.innerHTML = Styles.icons.unlink ? `<i class='${ Styles.icons.unlink }'></i>` : '✖';

				this.dom.appendChild( this.disconnectDOM );

				const onDisconnect = () => {

					this.links = [];
					this.dom.removeChild( this.disconnectDOM );

					this.disconnectDOM.removeEventListener( 'mousedown', onClick, true );
					this.disconnectDOM.removeEventListener( 'touchstart', onClick, true );
					this.disconnectDOM.removeEventListener( 'disconnect', onDisconnect, true );

					element.removeEventListener( 'connect', onConnect );
					element.removeEventListener( 'connectChildren', onConnect );
					element.removeEventListener( 'nodeConnect', onConnect );
					element.removeEventListener( 'nodeConnectChildren', onConnect );
					element.removeEventListener( 'dispose', onDispose );

					this.disconnectDOM = null;

				};

				const onConnect = ( e ) => {

					this.dispatchEvent( new Event( 'connectChildren' ) );

				};

				const onDispose = () => {

					this.connect();

				};

				const onClick = ( e ) => {

					e.stopPropagation();

					this.connect();

				};

				this.disconnectDOM.addEventListener( 'mousedown', onClick, true );
				this.disconnectDOM.addEventListener( 'touchstart', onClick, true );
				this.disconnectDOM.addEventListener( 'disconnect', onDisconnect, true );
				element.addEventListener( 'connect', onConnect );
				element.addEventListener( 'connectChildren', onConnect );
				element.addEventListener( 'nodeConnect', onConnect );
				element.addEventListener( 'nodeConnectChildren', onConnect );
				element.addEventListener( 'dispose', onDispose );

			}

		}

		this.dispatchEvent( new Event( 'connect' ) );

		return this;

	}

	dispose() {

		this.dispatchEvent( new Event( 'dispose' ) );

	}

	serialize( data ) {

		const height = this.getHeight();

		const inputs = [];
		const links = [];

		for ( const input of this.inputs ) {

			inputs.push( input.toJSON( data ).id );

		}

		for ( const link of this.links ) {

			if ( link.inputElement !== null && link.outputElement !== null ) {

				links.push( link.outputElement.toJSON( data ).id );

			}

		}

		if ( this.inputLength > 0 ) data.inputLength = this.inputLength;
		if ( this.outputLength > 0 ) data.outputLength = this.outputLength;

		if ( inputs.length > 0 ) data.inputs = inputs;
		if ( links.length > 0 ) data.links = links;

		if ( this.style !== '' ) {

			data.style = this.style;

		}

		if ( height !== '' ) {

			data.height = height;

		}

	}

	deserialize( data ) {

		if ( data.inputLength !== undefined ) this.setInput( data.inputLength );
		if ( data.outputLength !== undefined ) this.setOutput( data.outputLength );

		if ( data.inputs !== undefined ) {

			const inputs = this.inputs;

			if ( inputs.length > 0 ) {

				let index = 0;

				for ( const id of data.inputs ) {

					data.objects[ id ] = inputs[ index ++ ];

				}

			} else {

				for ( const id of data.inputs ) {

					this.add( data.objects[ id ] );

				}

			}

		}

		if ( data.links !== undefined ) {

			for ( const id of data.links ) {

				this.connect( data.objects[ id ] );

			}

		}

		if ( data.style !== undefined ) {

			this.setStyle( data.style );

		}

		if ( data.height !== undefined ) {

			this.setHeight( data.height );

		}

	}

	get linkedExtra() {

		const linkedElement = this.linkedElement;

		return linkedElement ? linkedElement.getExtra() : null;

	}

	get linkedElement() {

		const link = this.link;

		return link ? link.outputElement : null;

	}

	get link() {

		return this.links[ 0 ];

	}

	_createIO( type ) {

		const { dom } = this;

		const ioDOM = document.createElement( 'f-io' );
		ioDOM.style.visibility = 'hidden';
		ioDOM.className = type;

		const onConnectEvent = ( e ) => {

			e.preventDefault();

			e.stopPropagation();

			selected = null;

			const nodeDOM = this.node.dom;

			nodeDOM.classList.add( 'io-connect' );

			ioDOM.classList.add( 'connect' );
			dom.classList.add( 'select' );

			const defaultOutput = Link.InputDirection === 'left' ? 'lio' : 'rio';

			const link = type === defaultOutput ? new Link( this ) : new Link( null, this );

			this.links.push( link );

			draggableDOM( e, ( data ) => {

				if ( data.dragging === false ) {

					nodeDOM.classList.remove( 'io-connect' );

					ioDOM.classList.remove( 'connect' );
					dom.classList.remove( 'select' );

					this.links.splice( this.links.indexOf( link ), 1 );

					if ( selected !== null ) {

						if ( type === defaultOutput ) {

							link.outputElement = selected;

						} else {

							link.inputElement = selected;

						}

						// check if is an is circular link

						if ( link.outputElement.node.isCircular( link.inputElement.node ) ) {

							return;

						}

						//

						if ( link.inputElement.inputLength > 0 && link.outputElement.outputLength > 0 ) {

							link.inputElement.connect( link.outputElement );

						}

					}

				}

			}, 'connecting' );

		};

		ioDOM.addEventListener( 'mousedown', onConnectEvent, true );
		ioDOM.addEventListener( 'touchstart', onConnectEvent, true );

		return ioDOM;

	}

}

Element.prototype.isElement = true;
