import { DraggableElement } from './DraggableElement.js';

export class TitleElement extends DraggableElement {

	constructor( title, dragabble = true ) {

		super( dragabble );

		this.dom.className = 'title';

		const span = document.createElement( 'span' );
		span.innerText = title;

		this.dom.appendChild( span );

	}

}
