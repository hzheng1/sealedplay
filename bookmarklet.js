let main = async () => {
	let retrieveCardsWithRarity = async () => {
		const tables = Array.prototype.slice.call(
			document.querySelectorAll('table')
		);
		const cardLists = tables.filter((table) => {
			const parentTitle = table.parentElement.title.trim();
			if (parentTitle != 'English' && parentTitle != 'North American') {
				return false;
			}
			const colNames = new Set(
				Array.prototype.slice
					.call(table.querySelectorAll('thead th'))
					.map((th) => th.innerText.trim().toLowerCase())
			);
			return (
				(colNames.has('card number') || colNames.has('set number')) &&
				colNames.has('rarity') &&
				colNames.has('category')
			);
		});
		cardLists.sort((a, b) => {
			score = (x) => {
				switch (x.parentElement.title.trim()) {
					case 'English':
						return 0;
					case 'North American':
						return 1;
					default:
						return 2;
				}
			};
			return score(a) - score(b);
		});
		const cardList = cardLists[0];
		const colNames = Array.prototype.slice
			.call(cardList.querySelectorAll('thead th'))
			.map((th) => th.innerText.trim().toLowerCase());
		let cardNumberIndex = colNames.indexOf('card number');
		if (cardNumberIndex == -1) {
			cardNumberIndex = colNames.indexOf('set number');
		}
		const rarityIndex = colNames.indexOf('rarity');
		const categoryIndex = colNames.indexOf('category');
		const cards = [];
		const dataFetcherPromises = Array.prototype.slice
			.call(cardList.querySelectorAll('tbody tr'))
			.map((row) => {
				const rowText = Array.prototype.slice
					.call(row.querySelectorAll('td'))
					.map((x) => x.innerText);
				const cardNumber = rowText[cardNumberIndex];
				const rarity = rowText[rarityIndex];
				const category = rowText[categoryIndex].toLowerCase();
				return fetch(`https://yugioh.fandom.com/wiki/${cardNumber}`)
					.then((res) => res.text())
					.then((html) => {
						const image = html.match(
							/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/
						)[1];
						const title = html
							.match(/<title>([^<]+)<\/title>/)[1]
							.split('|')[0]
							.trim();
						switch (title) {
						}
						const passcode = (() => {
							switch (title) {
								case 'Obelisk the Tormentor':
									return '10000001';
								case 'Slifer the Sky Dragon':
									return '10000021';
								case 'The Winged Dragon of Ra':
									return '10000011';
								default:
									return html.match(/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[1];
							}
						})();
						cards.push({
							cardNumber,
							rarity,
							isExtra: !!category.match(/(?:fusion|synchro|xyz|link)/),
							image,
							passcode,
						});
					});
			});
		return Promise.all(dataFetcherPromises).then(() => {
			return cards.sort((a, b) => a.cardNumber.localeCompare(b.cardNumber));
		});
	};

	let cards = await retrieveCardsWithRarity();
	let cardsByRarity = {};
	cards.forEach((card) => {
		if (!(card.rarity in cardsByRarity)) {
			cardsByRarity[card.rarity] = [];
		}
		cardsByRarity[card.rarity].push(card);
	});

	let popupHtml = `
<style type="text/css">
	.column {
	  float: left;
	}

	.left {
	  width: 75%;
	}

	#main {
		overflow-y: scroll;
	  height: 95%;
	}

	.right {
	  width: 25%;
	}

	.card-thumbnail {
		width: 144px;
		margin: 8px;
	}

	.card-thumbnail.flip1 {
		transition: .5s ease-in-out;
		transform: scale(0, 1);
	}

	.card-thumbnail.flip2 {
		transition: .5s ease-in-out;
		transform: scale(1, 1);
	}

	.selected.extra {
		outline: 4px solid blue;
	}

	.selected {
		outline: 4px solid red;
	}
</style>
<div class="row">
	<div class="column left" >
		<button id="add">
			Open Booster
		</button>
		<button id="add-shown">
			Open Revealed Booster
		</button>
		<button id="sort">
			Sort
		</button>
		<button id="export">
			Export
		</button>
		<button id="select-all">
			Click All
		</button>
		<br />
		<div id="main">
		</div>
	</div>
	<div class="column right">
		<img id="preview" width="100%"></img>
	</div>
</div>`;

	let createSelector = () => {
		const randomElem = (arr) => {
			return arr[Math.floor(Math.random() * arr.length)];
		};
		const url = [location.protocol, '//', location.host, location.pathname]
			.join('')
			.replace('https://yugioh.fandom.com/wiki/', '');
		switch (url) {
			case 'Battle_Pack:_Epic_Dawn':
				return () => {
					let slot1 = cards.slice(0, 55);
					let slot2 = cards.slice(55, 110);
					let slot3 = cards.slice(110, 170);
					let slot4 = cards.slice(170);
					return [
						randomElem(slot1),
						randomElem(slot2),
						randomElem(slot3),
						randomElem(slot4),
						randomElem(cards),
					];
				};
			case 'Battle_Pack_2:_War_of_the_Giants':
				return () => {
					let commons = cardsByRarity['Common\nMosaic Rare'];
					let rares = cardsByRarity['Rare\nMosaic Rare'];
					return [
						randomElem(rares),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(cards),
					];
				};
			default:
				return () => {
					let commons = cardsByRarity['Common'];
					let rares = cardsByRarity['Rare'];
					let others = [];
					for (let key in cardsByRarity) {
						if (key == 'Common' || key == 'Rare') {
							continue;
						}
						others.push(...cardsByRarity[key]);
					}
					return [
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(rares),
						randomElem(others),
					];
				};
		}
	};

	let selector = createSelector();

	let win = window.open(
		'',
		'Sealed Play Card Selector',
		'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
	);
	win.document.body.innerHTML = popupHtml;

	let popupHandler = (document) => {
		const CARD_BACK =
			'https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133';

		const download = (filename, text) => {
			let element = document.createElement('a');
			element.setAttribute(
				'href',
				'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
			);
			element.setAttribute('download', filename);

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		};

		const createElement = (html) => {
			const div = document.createElement('div');
			div.innerHTML = html.trim();
			return div.firstChild;
		};

		const addCards = (revealed) => {
			let newCards = selector();
			newCards.forEach((elem) => {
				const newCard = createElement(
					`<img class="card-thumbnail ${
						elem.isExtra ? 'extra' : ''
					}" data-id="${elem.passcode}" src="${
						revealed ? elem.image : CARD_BACK
					}"></img>`
				);
				newCard.addEventListener('mouseover', () => {
					document.querySelector('#preview').src = newCard.src;
				});
				var cardRevealed = revealed;
				newCard.addEventListener('click', () => {
					if (!cardRevealed) {
						newCard.classList.add('flip1');
						animateEnd = () => {
							if (newCard.classList.contains('flip1')) {
								newCard.classList.remove('flip1');
								newCard.classList.add('flip2');
								newCard.src = elem.image;
								cardRevealed = true;
							} else if (newCard.classList.contains('flip2')) {
								newCard.classList.remove('flip2');
								newCard.removeEventListener('transitionend', animateEnd);
							}
						};
						newCard.addEventListener('transitionend', animateEnd);
					} else {
						if (newCard.classList.contains('selected')) {
							newCard.classList.remove('selected');
						} else {
							const isExtra = newCard.classList.contains('extra');
							const totalSelected = document.querySelectorAll(
								`.selected${isExtra ? '.extra' : ''}`
							).length;
							if (
								(!isExtra && totalSelected < 60) ||
								(isExtra && totalSelected < 15)
							) {
								newCard.classList.add('selected');
							}
						}
					}
				});
				const main = document.querySelector('#main');
				main.appendChild(newCard);
				main.scrollTo(0, main.scrollHeight);
			});
		};

		document.querySelector('#add').addEventListener('click', () => {
			addCards(false);
		});

		document.querySelector('#add-shown').addEventListener('click', () => {
			addCards(true);
		});

		document.querySelector('#sort').addEventListener('click', () => {
			const main = document.querySelector('#main');
			const items = main.childNodes;
			let itemsArr = [];
			for (var i in items) {
				if (items[i].nodeType == 1) {
					// get rid of the whitespace text nodes
					itemsArr.push(items[i]);
				}
			}

			itemsArr.sort(function (a, b) {
				const cardBackCompare =
					(a.src == CARD_BACK ? 1 : 0) - (b.src == CARD_BACK ? 1 : 0);
				let selectedCompare =
					(a.classList.contains('selected') ? -1 : 0) -
					(b.classList.contains('selected') ? -1 : 0);
				if (selectedCompare == 0) {
					selectedCompare =
						(a.classList.contains('extra') ? 1 : 0) -
						(b.classList.contains('extra') ? 1 : 0);
				}
				return (
					selectedCompare * 100 +
					cardBackCompare * 10 +
					(a.src == b.src ? 0 : a.src > b.src ? 1 : -1)
				);
			});

			for (i = 0; i < itemsArr.length; ++i) {
				main.appendChild(itemsArr[i]);
			}
		});

		document.querySelector('#export').addEventListener('click', () => {
			deck = '#main\n';
			document.querySelectorAll('.selected:not(.extra)').forEach((elem) => {
				deck += elem.getAttribute('data-id') + '\n';
			});
			deck += '#extra\n';
			document.querySelectorAll('.selected.extra').forEach((elem) => {
				deck += elem.getAttribute('data-id') + '\n';
			});
			deck += '!side\n';
			download('sealedplay.ydk', deck);
		});

		document.querySelector('#select-all').addEventListener('click', () => {
			document
				.querySelectorAll('.card-thumbnail:not(.selected)')
				.forEach((elem) => {
					elem.click();
				});
		});
	};

	popupHandler(win.document);
};

main();

/*
https://obfuscator.io/
const _0x55d6=['join','.selected','626958HhirAb','all','div','#extra\x0a','#select-all','scrollHeight','match','log','call','slice','removeEventListener','indexOf','classList','has','https://yugioh.fandom.com/wiki/','selected','1ByAHyk','736469nYQLfb','appendChild','thead\x20th','passcode','host','protocol','contains','remove','then','mouseover','getAttribute','961053jDMYdQ','innerText','2BTAwTr','category','text','Rare','!side\x0a','#add','\x22\x20src=\x22','369167tOIgTC','Common','nodeType','childNodes','display','tbody\x20tr','length','trim','body','flip2','sort','set\x20number','innerHTML','1144127ojVmaa','toLowerCase','#main','969997mHVBDQ','createElement','click','querySelector','title','localeCompare','transitionend','add','document','.selected.extra','replace','setAttribute','none','map','download','extra','scrollTo','forEach','push','firstChild','.selected:not(.extra)','sealedplay.ydk','href','image','#export','data-id','filter','rarity','cardNumber','querySelectorAll','open','addEventListener','src','Sealed\x20Play\x20Card\x20Selector','prototype','parentElement','1147563VggdhF','card\x20number','https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133','\x0a<style\x20type=\x22text/css\x22>\x0a\x09.column\x20{\x0a\x09\x20\x20float:\x20left;\x0a\x09}\x0a\x0a\x09.left\x20{\x0a\x09\x20\x20width:\x2075%;\x0a\x09}\x0a\x0a\x09#main\x20{\x0a\x09\x09overflow-y:\x20scroll;\x0a\x09\x20\x20height:\x2095%;\x0a\x09}\x0a\x0a\x09.right\x20{\x0a\x09\x20\x20width:\x2025%;\x0a\x09}\x0a\x0a\x09.card-thumbnail\x20{\x0a\x09\x09width:\x20144px;\x0a\x09\x09margin:\x208px;\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip1\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(0,\x201);\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip2\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(1,\x201);\x0a\x09}\x0a\x0a\x09.selected.extra\x20{\x0a\x09\x09outline:\x204px\x20solid\x20blue;\x0a\x09}\x0a\x0a\x09.selected\x20{\x0a\x09\x09outline:\x204px\x20solid\x20red;\x0a\x09}\x0a</style>\x0a<div\x20class=\x22row\x22>\x0a\x09<div\x20class=\x22column\x20left\x22\x20>\x0a\x09\x09<button\x20id=\x22add\x22>\x0a\x09\x09\x09Open\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22add-shown\x22>\x0a\x09\x09\x09Open\x20Revealed\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22sort\x22>\x0a\x09\x09\x09Sort\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22export\x22>\x0a\x09\x09\x09Export\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22select-all\x22>\x0a\x09\x09\x09Click\x20All\x0a\x09\x09</button>\x0a\x09\x09<br\x20/>\x0a\x09\x09<div\x20id=\x22main\x22>\x0a\x09\x09</div>\x0a\x09</div>\x0a\x09<div\x20class=\x22column\x20right\x22>\x0a\x09\x09<img\x20id=\x22preview\x22\x20width=\x22100%\x22></img>\x0a\x09</div>\x0a</div>','flip1','table','floor','English'];const _0x37e5=function(_0x231b09,_0x1dc87f){_0x231b09=_0x231b09-0x1e9;let _0x55d64b=_0x55d6[_0x231b09];return _0x55d64b;};(function(_0x49e8a8,_0xec053f){const _0x50b49d=_0x37e5;while(!![]){try{const _0x186f98=-parseInt(_0x50b49d(0x21d))+-parseInt(_0x50b49d(0x202))+-parseInt(_0x50b49d(0x22a))*-parseInt(_0x50b49d(0x231))+-parseInt(_0x50b49d(0x241))+-parseInt(_0x50b49d(0x228))*-parseInt(_0x50b49d(0x21c))+parseInt(_0x50b49d(0x20c))+parseInt(_0x50b49d(0x23e));if(_0x186f98===_0xec053f)break;else _0x49e8a8['push'](_0x49e8a8['shift']());}catch(_0x40d0a5){_0x49e8a8['push'](_0x49e8a8['shift']());}}}(_0x55d6,0x967fb));let main=async()=>{const _0x3768c3=_0x37e5;let _0x599ca3=async()=>{const _0x2e5f77=_0x37e5,_0x4a2e7a=Array[_0x2e5f77(0x200)][_0x2e5f77(0x215)]['call'](document[_0x2e5f77(0x1fb)](_0x2e5f77(0x207))),_0x38bbe2=_0x4a2e7a[_0x2e5f77(0x1f8)](_0x4fd14b=>{const _0x5b8537=_0x2e5f77,_0x2d3cd0=_0x4fd14b[_0x5b8537(0x201)][_0x5b8537(0x245)][_0x5b8537(0x238)]();if(_0x2d3cd0!='English'&&_0x2d3cd0!='North\x20American')return![];const _0x54c3d1=new Set(Array[_0x5b8537(0x200)][_0x5b8537(0x215)][_0x5b8537(0x214)](_0x4fd14b[_0x5b8537(0x1fb)](_0x5b8537(0x21f)))[_0x5b8537(0x1eb)](_0x423dc3=>_0x423dc3[_0x5b8537(0x229)][_0x5b8537(0x238)]()['toLowerCase']()));return(_0x54c3d1[_0x5b8537(0x219)]('card\x20number')||_0x54c3d1['has']('set\x20number'))&&_0x54c3d1[_0x5b8537(0x219)](_0x5b8537(0x1f9))&&_0x54c3d1[_0x5b8537(0x219)](_0x5b8537(0x22b));});_0x38bbe2[_0x2e5f77(0x23b)]((_0x461082,_0x4ff688)=>{return score=_0x604b18=>{const _0x4cf754=_0x37e5;switch(_0x604b18['parentElement'][_0x4cf754(0x245)][_0x4cf754(0x238)]()){case _0x4cf754(0x209):return 0x0;case'North\x20American':return 0x1;default:return 0x2;}},score(_0x461082)-score(_0x4ff688);});const _0x39ce97=_0x38bbe2[0x0],_0x2684ab=Array['prototype']['slice']['call'](_0x39ce97[_0x2e5f77(0x1fb)](_0x2e5f77(0x21f)))[_0x2e5f77(0x1eb)](_0x2dc0ec=>_0x2dc0ec[_0x2e5f77(0x229)][_0x2e5f77(0x238)]()[_0x2e5f77(0x23f)]());let _0x559a2f=_0x2684ab['indexOf'](_0x2e5f77(0x203));_0x559a2f==-0x1&&(_0x559a2f=_0x2684ab[_0x2e5f77(0x217)](_0x2e5f77(0x23c)));const _0x101d7e=_0x2684ab[_0x2e5f77(0x217)](_0x2e5f77(0x1f9)),_0x11dcfc=_0x2684ab['indexOf'](_0x2e5f77(0x22b)),_0x135aec=[],_0x5b9184=Array['prototype'][_0x2e5f77(0x215)][_0x2e5f77(0x214)](_0x39ce97[_0x2e5f77(0x1fb)](_0x2e5f77(0x236)))[_0x2e5f77(0x1eb)](_0x1f0f76=>{const _0x5d4a4f=_0x2e5f77,_0x15de16=Array['prototype'][_0x5d4a4f(0x215)][_0x5d4a4f(0x214)](_0x1f0f76[_0x5d4a4f(0x1fb)]('td'))[_0x5d4a4f(0x1eb)](_0x9991bd=>_0x9991bd['innerText']),_0x962099=_0x15de16[_0x559a2f],_0x2ec30e=_0x15de16[_0x101d7e],_0x22f164=_0x15de16[_0x11dcfc][_0x5d4a4f(0x23f)]();return fetch('https://yugioh.fandom.com/wiki/'+_0x962099)[_0x5d4a4f(0x225)](_0xa112b0=>_0xa112b0[_0x5d4a4f(0x22c)]())['then'](_0x166283=>{const _0x12062e=_0x5d4a4f,_0x5cfee1=_0x166283[_0x12062e(0x212)](/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/)[0x1],_0x580d37=_0x166283['match'](/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[0x1];_0x135aec[_0x12062e(0x1f0)]({'cardNumber':_0x962099,'rarity':_0x2ec30e,'isExtra':!!_0x22f164[_0x12062e(0x212)](/(?:fusion|synchro|xyz|link)/),'image':_0x5cfee1,'passcode':_0x580d37});});});return Promise[_0x2e5f77(0x20d)](_0x5b9184)['then'](()=>{const _0x407c77=_0x2e5f77;return _0x135aec['sort']((_0x304b3c,_0x35e375)=>_0x304b3c[_0x407c77(0x1fa)][_0x407c77(0x246)](_0x35e375['cardNumber']));});},_0x38c30e=await _0x599ca3(),_0x3f10af={};_0x38c30e[_0x3768c3(0x1ef)](_0x4f9153=>{const _0x2ab156=_0x3768c3;!(_0x4f9153[_0x2ab156(0x1f9)]in _0x3f10af)&&(_0x3f10af[_0x4f9153['rarity']]=[]),_0x3f10af[_0x4f9153['rarity']][_0x2ab156(0x1f0)](_0x4f9153);}),console[_0x3768c3(0x213)](_0x38c30e);let _0x2f0bfe=_0x3768c3(0x205),_0x39b746=()=>{const _0x6441d=_0x3768c3,_0x26e998=_0x5d2f68=>{const _0x4ff911=_0x37e5;return _0x5d2f68[Math[_0x4ff911(0x208)](Math['random']()*_0x5d2f68[_0x4ff911(0x237)])];},_0x4abb06=[location[_0x6441d(0x222)],'//',location[_0x6441d(0x221)],location['pathname']][_0x6441d(0x20a)]('')[_0x6441d(0x24b)](_0x6441d(0x21a),'');switch(_0x4abb06){default:return()=>{const _0x1912ca=_0x6441d;let _0x25b6f5=_0x3f10af[_0x1912ca(0x232)],_0x1ca133=_0x3f10af[_0x1912ca(0x22d)],_0xf63b64=[];for(let _0x298b24 in _0x3f10af){if(_0x298b24==_0x1912ca(0x232)||_0x298b24==_0x1912ca(0x22d))continue;_0xf63b64[_0x1912ca(0x1f0)](..._0x3f10af[_0x298b24]);}return[_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x1ca133),_0x26e998(_0xf63b64)];};}},_0x1c5f80=_0x39b746(),_0x3245e=window[_0x3768c3(0x1fc)]('',_0x3768c3(0x1ff),'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes');_0x3245e[_0x3768c3(0x249)]['body'][_0x3768c3(0x23d)]=_0x2f0bfe;let _0x89f91f=_0x1c879a=>{const _0x5381a0=_0x3768c3,_0x2f4e4f=_0x5381a0(0x204),_0x1aa790=(_0x2f1484,_0x479ceb)=>{const _0x59bd87=_0x5381a0;let _0xe16421=_0x1c879a[_0x59bd87(0x242)]('a');_0xe16421[_0x59bd87(0x1e9)](_0x59bd87(0x1f4),'data:text/plain;charset=utf-8,'+encodeURIComponent(_0x479ceb)),_0xe16421[_0x59bd87(0x1e9)](_0x59bd87(0x1ec),_0x2f1484),_0xe16421['style'][_0x59bd87(0x235)]=_0x59bd87(0x1ea),_0x1c879a[_0x59bd87(0x239)][_0x59bd87(0x21e)](_0xe16421),_0xe16421[_0x59bd87(0x243)](),_0x1c879a['body']['removeChild'](_0xe16421);},_0x436faa=_0x37f45f=>{const _0x5c16bc=_0x5381a0,_0x32afcb=_0x1c879a[_0x5c16bc(0x242)](_0x5c16bc(0x20e));return _0x32afcb[_0x5c16bc(0x23d)]=_0x37f45f['trim'](),_0x32afcb[_0x5c16bc(0x1f1)];},_0x144758=_0x119502=>{const _0x341429=_0x5381a0;let _0x391565=_0x1c5f80();_0x391565[_0x341429(0x1ef)](_0x12c272=>{const _0x2a1808=_0x341429,_0x2e302e=_0x436faa('<img\x20class=\x22card-thumbnail\x20'+(_0x12c272['isExtra']?_0x2a1808(0x1ed):'')+'\x22\x20data-id=\x22'+_0x12c272[_0x2a1808(0x220)]+_0x2a1808(0x230)+(_0x119502?_0x12c272[_0x2a1808(0x1f5)]:_0x2f4e4f)+'\x22></img>');_0x2e302e[_0x2a1808(0x1fd)](_0x2a1808(0x226),()=>{const _0x2acd68=_0x2a1808;_0x1c879a[_0x2acd68(0x244)]('#preview')['src']=_0x2e302e['src'];});var _0x39c491=_0x119502;_0x2e302e[_0x2a1808(0x1fd)](_0x2a1808(0x243),()=>{const _0x54736b=_0x2a1808;if(!_0x39c491)_0x2e302e[_0x54736b(0x218)][_0x54736b(0x248)](_0x54736b(0x206)),animateEnd=()=>{const _0xf55f69=_0x54736b;if(_0x2e302e['classList'][_0xf55f69(0x223)](_0xf55f69(0x206)))_0x2e302e[_0xf55f69(0x218)][_0xf55f69(0x224)](_0xf55f69(0x206)),_0x2e302e[_0xf55f69(0x218)][_0xf55f69(0x248)](_0xf55f69(0x23a)),_0x2e302e[_0xf55f69(0x1fe)]=_0x12c272['image'],_0x39c491=!![];else _0x2e302e[_0xf55f69(0x218)]['contains']('flip2')&&(_0x2e302e[_0xf55f69(0x218)]['remove'](_0xf55f69(0x23a)),_0x2e302e[_0xf55f69(0x216)](_0xf55f69(0x247),animateEnd));},_0x2e302e[_0x54736b(0x1fd)]('transitionend',animateEnd);else{if(_0x2e302e[_0x54736b(0x218)][_0x54736b(0x223)]('selected'))_0x2e302e['classList']['remove']('selected');else{const _0x20b94f=_0x2e302e['classList'][_0x54736b(0x223)]('extra'),_0x1915ed=_0x1c879a['querySelectorAll'](_0x54736b(0x20b)+(_0x20b94f?'.extra':''))[_0x54736b(0x237)];(!_0x20b94f&&_0x1915ed<0x3c||_0x20b94f&&_0x1915ed<0xf)&&_0x2e302e[_0x54736b(0x218)][_0x54736b(0x248)]('selected');}}});const _0x56086d=_0x1c879a[_0x2a1808(0x244)]('#main');_0x56086d['appendChild'](_0x2e302e),_0x56086d[_0x2a1808(0x1ee)](0x0,_0x56086d[_0x2a1808(0x211)]);});};_0x1c879a['querySelector'](_0x5381a0(0x22f))['addEventListener'](_0x5381a0(0x243),()=>{_0x144758(![]);}),_0x1c879a[_0x5381a0(0x244)]('#add-shown')[_0x5381a0(0x1fd)](_0x5381a0(0x243),()=>{_0x144758(!![]);}),_0x1c879a['querySelector']('#sort')[_0x5381a0(0x1fd)](_0x5381a0(0x243),()=>{const _0x482d69=_0x5381a0,_0x12dce3=_0x1c879a[_0x482d69(0x244)](_0x482d69(0x240)),_0x1da7e1=_0x12dce3[_0x482d69(0x234)];let _0x18eee0=[];for(var _0xd88647 in _0x1da7e1){_0x1da7e1[_0xd88647][_0x482d69(0x233)]==0x1&&_0x18eee0[_0x482d69(0x1f0)](_0x1da7e1[_0xd88647]);}_0x18eee0[_0x482d69(0x23b)](function(_0x14687a,_0x3815c9){const _0x51f64a=_0x482d69,_0x4e613c=(_0x14687a[_0x51f64a(0x1fe)]==_0x2f4e4f?0x1:0x0)-(_0x3815c9['src']==_0x2f4e4f?0x1:0x0);let _0x2a7aa0=(_0x14687a[_0x51f64a(0x218)][_0x51f64a(0x223)]('selected')?-0x1:0x0)-(_0x3815c9[_0x51f64a(0x218)][_0x51f64a(0x223)](_0x51f64a(0x21b))?-0x1:0x0);return _0x2a7aa0==0x0&&(_0x2a7aa0=(_0x14687a['classList'][_0x51f64a(0x223)](_0x51f64a(0x1ed))?0x1:0x0)-(_0x3815c9[_0x51f64a(0x218)]['contains'](_0x51f64a(0x1ed))?0x1:0x0)),_0x2a7aa0*0x64+_0x4e613c*0xa+(_0x14687a[_0x51f64a(0x1fe)]==_0x3815c9['src']?0x0:_0x14687a[_0x51f64a(0x1fe)]>_0x3815c9['src']?0x1:-0x1);});for(_0xd88647=0x0;_0xd88647<_0x18eee0[_0x482d69(0x237)];++_0xd88647){_0x12dce3[_0x482d69(0x21e)](_0x18eee0[_0xd88647]);}}),_0x1c879a[_0x5381a0(0x244)](_0x5381a0(0x1f6))['addEventListener']('click',()=>{const _0x566820=_0x5381a0;deck='#main\x0a',_0x1c879a[_0x566820(0x1fb)](_0x566820(0x1f2))[_0x566820(0x1ef)](_0x16aa4c=>{const _0x58ffbe=_0x566820;deck+=_0x16aa4c[_0x58ffbe(0x227)](_0x58ffbe(0x1f7))+'\x0a';}),deck+=_0x566820(0x20f),_0x1c879a['querySelectorAll'](_0x566820(0x24a))[_0x566820(0x1ef)](_0x4975ac=>{const _0x540b9f=_0x566820;deck+=_0x4975ac[_0x540b9f(0x227)](_0x540b9f(0x1f7))+'\x0a';}),deck+=_0x566820(0x22e),_0x1aa790(_0x566820(0x1f3),deck);}),_0x1c879a['querySelector'](_0x5381a0(0x210))[_0x5381a0(0x1fd)](_0x5381a0(0x243),()=>{const _0x2018f6=_0x5381a0;_0x1c879a['querySelectorAll']('.card-thumbnail:not(.selected)')[_0x2018f6(0x1ef)](_0x537095=>{_0x537095['click']();});});};_0x89f91f(_0x3245e[_0x3768c3(0x249)]);};main();

http://js.do/blog/bookmarklets/
javascript:const _0x21ce=['Battle_Pack_2:_War_of_the_Giants','createElement','category','removeEventListener','addEventListener','src','click','extra','10000011','passcode','then','classList','\x0a<style\x20type=\x22text/css\x22>\x0a\x09.column\x20{\x0a\x09\x20\x20float:\x20left;\x0a\x09}\x0a\x0a\x09.left\x20{\x0a\x09\x20\x20width:\x2075%;\x0a\x09}\x0a\x0a\x09#main\x20{\x0a\x09\x09overflow-y:\x20scroll;\x0a\x09\x20\x20height:\x2095%;\x0a\x09}\x0a\x0a\x09.right\x20{\x0a\x09\x20\x20width:\x2025%;\x0a\x09}\x0a\x0a\x09.card-thumbnail\x20{\x0a\x09\x09width:\x20144px;\x0a\x09\x09margin:\x208px;\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip1\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(0,\x201);\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip2\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(1,\x201);\x0a\x09}\x0a\x0a\x09.selected.extra\x20{\x0a\x09\x09outline:\x204px\x20solid\x20blue;\x0a\x09}\x0a\x0a\x09.selected\x20{\x0a\x09\x09outline:\x204px\x20solid\x20red;\x0a\x09}\x0a</style>\x0a<div\x20class=\x22row\x22>\x0a\x09<div\x20class=\x22column\x20left\x22\x20>\x0a\x09\x09<button\x20id=\x22add\x22>\x0a\x09\x09\x09Open\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22add-shown\x22>\x0a\x09\x09\x09Open\x20Revealed\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22sort\x22>\x0a\x09\x09\x09Sort\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22export\x22>\x0a\x09\x09\x09Export\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22select-all\x22>\x0a\x09\x09\x09Click\x20All\x0a\x09\x09</button>\x0a\x09\x09<br\x20/>\x0a\x09\x09<div\x20id=\x22main\x22>\x0a\x09\x09</div>\x0a\x09</div>\x0a\x09<div\x20class=\x22column\x20right\x22>\x0a\x09\x09<img\x20id=\x22preview\x22\x20width=\x22100%\x22></img>\x0a\x09</div>\x0a</div>','join','download','prototype','\x22\x20data-id=\x22','72139vihRRs','9317QvQnQG','document','call','style','#sort','#export','set\x20number','floor','mouseover','body','<img\x20class=\x22card-thumbnail\x20','47855Ejlmqw','selected','contains','10000001','922547aROgDf','sort','North\x20American','slice','has','remove','Battle_Pack:_Epic_Dawn','childNodes','image','toLowerCase','appendChild','#add','5oNeQdo','map','all','scrollTo','742208aZGbEi','.selected:not(.extra)','none','rarity','host','random','1TTlaDU','replace','text','card\x20number','transitionend','parentElement','push','Obelisk\x20the\x20Tormentor','English','match','flip1','innerHTML','#preview','div','https://yugioh.fandom.com/wiki/','innerText','30620AenplA','sealedplay.ydk','length','tbody\x20tr','indexOf','getAttribute','Common','#main\x0a','trim','.selected.extra','Common\x0aMosaic\x20Rare','querySelector','Rare\x0aMosaic\x20Rare','The\x20Winged\x20Dragon\x20of\x20Ra','Slifer\x20the\x20Sky\x20Dragon','open','pathname','https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133','nodeType','add','Rare','forEach','.selected','isExtra','73dKjaTK','querySelectorAll','title','flip2','filter','10000021','28UnXpLV','#add-shown','scrollHeight','table','data:text/plain;charset=utf-8,','653013BzLAWo','protocol'];const _0x519b=function(_0x5c22b6,_0x82d450){_0x5c22b6=_0x5c22b6-0x11b;let _0x21ce64=_0x21ce[_0x5c22b6];return _0x21ce64;};(function(_0xb1b0c6,_0x2ecd02){const _0x4bf9c0=_0x519b;while(!![]){try{const _0x2e0b0e=-parseInt(_0x4bf9c0(0x14a))+-parseInt(_0x4bf9c0(0x12b))+-parseInt(_0x4bf9c0(0x164))*parseInt(_0x4bf9c0(0x14e))+parseInt(_0x4bf9c0(0x15a))*parseInt(_0x4bf9c0(0x174))+parseInt(_0x4bf9c0(0x13f))*parseInt(_0x4bf9c0(0x120))+-parseInt(_0x4bf9c0(0x15e))+parseInt(_0x4bf9c0(0x126))*parseInt(_0x4bf9c0(0x13e));if(_0x2e0b0e===_0x2ecd02)break;else _0xb1b0c6['push'](_0xb1b0c6['shift']());}catch(_0x1bef3c){_0xb1b0c6['push'](_0xb1b0c6['shift']());}}}(_0x21ce,0x77056));let main=async()=>{const _0x326196=_0x519b;let _0x234491=async()=>{const _0x1ab052=_0x519b,_0x277d55=Array[_0x1ab052(0x13c)]['slice'][_0x1ab052(0x141)](document['querySelectorAll'](_0x1ab052(0x129))),_0x4355a9=_0x277d55[_0x1ab052(0x124)](_0x14aba4=>{const _0x17aa38=_0x1ab052,_0x26072c=_0x14aba4[_0x17aa38(0x169)][_0x17aa38(0x122)][_0x17aa38(0x17c)]();if(_0x26072c!=_0x17aa38(0x16c)&&_0x26072c!='North\x20American')return![];const _0x228d6f=new Set(Array[_0x17aa38(0x13c)][_0x17aa38(0x151)][_0x17aa38(0x141)](_0x14aba4[_0x17aa38(0x121)]('thead\x20th'))['map'](_0x5ad6a3=>_0x5ad6a3['innerText'][_0x17aa38(0x17c)]()[_0x17aa38(0x157)]()));return(_0x228d6f[_0x17aa38(0x152)](_0x17aa38(0x167))||_0x228d6f['has'](_0x17aa38(0x145)))&&_0x228d6f[_0x17aa38(0x152)](_0x17aa38(0x161))&&_0x228d6f[_0x17aa38(0x152)](_0x17aa38(0x12f));});_0x4355a9['sort']((_0x179f3f,_0x182f1d)=>{return score=_0x2a598b=>{const _0x5e7875=_0x519b;switch(_0x2a598b[_0x5e7875(0x169)][_0x5e7875(0x122)][_0x5e7875(0x17c)]()){case'English':return 0x0;case _0x5e7875(0x150):return 0x1;default:return 0x2;}},score(_0x179f3f)-score(_0x182f1d);});const _0x18bdc2=_0x4355a9[0x0],_0x3ac5f7=Array[_0x1ab052(0x13c)]['slice'][_0x1ab052(0x141)](_0x18bdc2[_0x1ab052(0x121)]('thead\x20th'))['map'](_0x54739b=>_0x54739b[_0x1ab052(0x173)][_0x1ab052(0x17c)]()[_0x1ab052(0x157)]());let _0x4ba094=_0x3ac5f7['indexOf'](_0x1ab052(0x167));_0x4ba094==-0x1&&(_0x4ba094=_0x3ac5f7['indexOf'](_0x1ab052(0x145)));const _0xe82823=_0x3ac5f7[_0x1ab052(0x178)](_0x1ab052(0x161)),_0x5cc681=_0x3ac5f7[_0x1ab052(0x178)](_0x1ab052(0x12f)),_0x1a5ab7=[],_0x37d598=Array[_0x1ab052(0x13c)][_0x1ab052(0x151)][_0x1ab052(0x141)](_0x18bdc2[_0x1ab052(0x121)](_0x1ab052(0x177)))['map'](_0xc0d24e=>{const _0x3cc9b5=_0x1ab052,_0x102e1c=Array[_0x3cc9b5(0x13c)]['slice'][_0x3cc9b5(0x141)](_0xc0d24e['querySelectorAll']('td'))[_0x3cc9b5(0x15b)](_0x24a315=>_0x24a315['innerText']),_0x1e4b19=_0x102e1c[_0x4ba094],_0x442e6a=_0x102e1c[_0xe82823],_0x141e88=_0x102e1c[_0x5cc681]['toLowerCase']();return fetch(_0x3cc9b5(0x172)+_0x1e4b19)[_0x3cc9b5(0x137)](_0x112d1a=>_0x112d1a[_0x3cc9b5(0x166)]())[_0x3cc9b5(0x137)](_0x79bdb=>{const _0x5a858d=_0x3cc9b5,_0x104f4f=_0x79bdb[_0x5a858d(0x16d)](/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/)[0x1],_0x4b867c=_0x79bdb[_0x5a858d(0x16d)](/<title>([^<]+)<\/title>/)[0x1]['split']('|')[0x0][_0x5a858d(0x17c)]();switch(_0x4b867c){}const _0x1ef75e=(()=>{const _0x5a190a=_0x5a858d;switch(_0x4b867c){case _0x5a190a(0x16b):return _0x5a190a(0x14d);case _0x5a190a(0x182):return _0x5a190a(0x125);case _0x5a190a(0x181):return _0x5a190a(0x135);default:return _0x79bdb[_0x5a190a(0x16d)](/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[0x1];}})();_0x1a5ab7[_0x5a858d(0x16a)]({'cardNumber':_0x1e4b19,'rarity':_0x442e6a,'isExtra':!!_0x141e88['match'](/(?:fusion|synchro|xyz|link)/),'image':_0x104f4f,'passcode':_0x1ef75e});});});return Promise[_0x1ab052(0x15c)](_0x37d598)['then'](()=>{const _0x2f257d=_0x1ab052;return _0x1a5ab7[_0x2f257d(0x14f)]((_0x3f1ebe,_0x311405)=>_0x3f1ebe['cardNumber']['localeCompare'](_0x311405['cardNumber']));});},_0x4113ba=await _0x234491(),_0x5ccab6={};_0x4113ba[_0x326196(0x11d)](_0x307855=>{const _0x1cecaa=_0x326196;!(_0x307855['rarity']in _0x5ccab6)&&(_0x5ccab6[_0x307855[_0x1cecaa(0x161)]]=[]),_0x5ccab6[_0x307855['rarity']][_0x1cecaa(0x16a)](_0x307855);});let _0x2daaf8=_0x326196(0x139),_0xc7665e=()=>{const _0x1acade=_0x326196,_0x3eeb6b=_0x14f109=>{const _0x26cb9f=_0x519b;return _0x14f109[Math[_0x26cb9f(0x146)](Math[_0x26cb9f(0x163)]()*_0x14f109[_0x26cb9f(0x176)])];},_0x9b8f5=[location[_0x1acade(0x12c)],'//',location[_0x1acade(0x162)],location[_0x1acade(0x184)]][_0x1acade(0x13a)]('')[_0x1acade(0x165)]('https://yugioh.fandom.com/wiki/','');switch(_0x9b8f5){case _0x1acade(0x154):return()=>{const _0x1f94bc=_0x1acade;let _0x12a77b=_0x4113ba['slice'](0x0,0x37),_0x5b1863=_0x4113ba[_0x1f94bc(0x151)](0x37,0x6e),_0x1a49a1=_0x4113ba[_0x1f94bc(0x151)](0x6e,0xaa),_0x3e4027=_0x4113ba[_0x1f94bc(0x151)](0xaa);return[_0x3eeb6b(_0x12a77b),_0x3eeb6b(_0x5b1863),_0x3eeb6b(_0x1a49a1),_0x3eeb6b(_0x3e4027),_0x3eeb6b(_0x4113ba)];};case _0x1acade(0x12d):return()=>{const _0x14b6c2=_0x1acade;let _0x3f3d9a=_0x5ccab6[_0x14b6c2(0x17e)],_0x4bc108=_0x5ccab6[_0x14b6c2(0x180)];return[_0x3eeb6b(_0x4bc108),_0x3eeb6b(_0x3f3d9a),_0x3eeb6b(_0x3f3d9a),_0x3eeb6b(_0x3f3d9a),_0x3eeb6b(_0x4113ba)];};default:return()=>{const _0x2481bf=_0x1acade;let _0x392194=_0x5ccab6['Common'],_0x442b2e=_0x5ccab6['Rare'],_0x163e2c=[];for(let _0x2dab81 in _0x5ccab6){if(_0x2dab81==_0x2481bf(0x17a)||_0x2dab81==_0x2481bf(0x11c))continue;_0x163e2c[_0x2481bf(0x16a)](..._0x5ccab6[_0x2dab81]);}return[_0x3eeb6b(_0x392194),_0x3eeb6b(_0x392194),_0x3eeb6b(_0x392194),_0x3eeb6b(_0x392194),_0x3eeb6b(_0x392194),_0x3eeb6b(_0x392194),_0x3eeb6b(_0x392194),_0x3eeb6b(_0x442b2e),_0x3eeb6b(_0x163e2c)];};}},_0x47ce17=_0xc7665e(),_0x4a11f1=window[_0x326196(0x183)]('','Sealed\x20Play\x20Card\x20Selector','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes');_0x4a11f1[_0x326196(0x140)][_0x326196(0x148)][_0x326196(0x16f)]=_0x2daaf8;let _0x40f7e7=_0x3563b3=>{const _0x8eee96=_0x326196,_0x2a1cf2=_0x8eee96(0x185),_0x3edcf7=(_0x397d5a,_0x4b4268)=>{const _0x3b4f36=_0x8eee96;let _0x2a7080=_0x3563b3['createElement']('a');_0x2a7080['setAttribute']('href',_0x3b4f36(0x12a)+encodeURIComponent(_0x4b4268)),_0x2a7080['setAttribute'](_0x3b4f36(0x13b),_0x397d5a),_0x2a7080[_0x3b4f36(0x142)]['display']=_0x3b4f36(0x160),_0x3563b3[_0x3b4f36(0x148)][_0x3b4f36(0x158)](_0x2a7080),_0x2a7080[_0x3b4f36(0x133)](),_0x3563b3['body']['removeChild'](_0x2a7080);},_0x13cd71=_0xe6eb6=>{const _0x52dfb4=_0x8eee96,_0x367178=_0x3563b3[_0x52dfb4(0x12e)](_0x52dfb4(0x171));return _0x367178[_0x52dfb4(0x16f)]=_0xe6eb6[_0x52dfb4(0x17c)](),_0x367178['firstChild'];},_0xe429c4=_0x1ffbc9=>{const _0x35ec57=_0x8eee96;let _0x425a17=_0x47ce17();_0x425a17[_0x35ec57(0x11d)](_0x57f829=>{const _0x4cb951=_0x35ec57,_0x5a51b1=_0x13cd71(_0x4cb951(0x149)+(_0x57f829[_0x4cb951(0x11f)]?_0x4cb951(0x134):'')+_0x4cb951(0x13d)+_0x57f829[_0x4cb951(0x136)]+'\x22\x20src=\x22'+(_0x1ffbc9?_0x57f829[_0x4cb951(0x156)]:_0x2a1cf2)+'\x22></img>');_0x5a51b1[_0x4cb951(0x131)](_0x4cb951(0x147),()=>{const _0x404d62=_0x4cb951;_0x3563b3[_0x404d62(0x17f)](_0x404d62(0x170))['src']=_0x5a51b1[_0x404d62(0x132)];});var _0x80433c=_0x1ffbc9;_0x5a51b1[_0x4cb951(0x131)](_0x4cb951(0x133),()=>{const _0x1ab739=_0x4cb951;if(!_0x80433c)_0x5a51b1[_0x1ab739(0x138)][_0x1ab739(0x11b)]('flip1'),animateEnd=()=>{const _0x1d6223=_0x1ab739;if(_0x5a51b1[_0x1d6223(0x138)][_0x1d6223(0x14c)]('flip1'))_0x5a51b1[_0x1d6223(0x138)][_0x1d6223(0x153)](_0x1d6223(0x16e)),_0x5a51b1['classList'][_0x1d6223(0x11b)](_0x1d6223(0x123)),_0x5a51b1[_0x1d6223(0x132)]=_0x57f829[_0x1d6223(0x156)],_0x80433c=!![];else _0x5a51b1[_0x1d6223(0x138)][_0x1d6223(0x14c)](_0x1d6223(0x123))&&(_0x5a51b1[_0x1d6223(0x138)]['remove'](_0x1d6223(0x123)),_0x5a51b1[_0x1d6223(0x130)](_0x1d6223(0x168),animateEnd));},_0x5a51b1[_0x1ab739(0x131)](_0x1ab739(0x168),animateEnd);else{if(_0x5a51b1['classList'][_0x1ab739(0x14c)](_0x1ab739(0x14b)))_0x5a51b1[_0x1ab739(0x138)][_0x1ab739(0x153)](_0x1ab739(0x14b));else{const _0x11a8fd=_0x5a51b1['classList'][_0x1ab739(0x14c)](_0x1ab739(0x134)),_0x3d905a=_0x3563b3[_0x1ab739(0x121)](_0x1ab739(0x11e)+(_0x11a8fd?'.extra':''))[_0x1ab739(0x176)];(!_0x11a8fd&&_0x3d905a<0x3c||_0x11a8fd&&_0x3d905a<0xf)&&_0x5a51b1[_0x1ab739(0x138)][_0x1ab739(0x11b)](_0x1ab739(0x14b));}}});const _0x37cc40=_0x3563b3[_0x4cb951(0x17f)]('#main');_0x37cc40[_0x4cb951(0x158)](_0x5a51b1),_0x37cc40[_0x4cb951(0x15d)](0x0,_0x37cc40[_0x4cb951(0x128)]);});};_0x3563b3['querySelector'](_0x8eee96(0x159))['addEventListener'](_0x8eee96(0x133),()=>{_0xe429c4(![]);}),_0x3563b3[_0x8eee96(0x17f)](_0x8eee96(0x127))[_0x8eee96(0x131)](_0x8eee96(0x133),()=>{_0xe429c4(!![]);}),_0x3563b3[_0x8eee96(0x17f)](_0x8eee96(0x143))['addEventListener'](_0x8eee96(0x133),()=>{const _0x587a9a=_0x8eee96,_0x51a573=_0x3563b3[_0x587a9a(0x17f)]('#main'),_0x529658=_0x51a573[_0x587a9a(0x155)];let _0x1f8a8c=[];for(var _0x52e2ee in _0x529658){_0x529658[_0x52e2ee][_0x587a9a(0x186)]==0x1&&_0x1f8a8c[_0x587a9a(0x16a)](_0x529658[_0x52e2ee]);}_0x1f8a8c[_0x587a9a(0x14f)](function(_0x3d6d24,_0x3ea00d){const _0x13e5d5=_0x587a9a,_0x2fe4f6=(_0x3d6d24['src']==_0x2a1cf2?0x1:0x0)-(_0x3ea00d[_0x13e5d5(0x132)]==_0x2a1cf2?0x1:0x0);let _0x21dc55=(_0x3d6d24[_0x13e5d5(0x138)][_0x13e5d5(0x14c)](_0x13e5d5(0x14b))?-0x1:0x0)-(_0x3ea00d[_0x13e5d5(0x138)][_0x13e5d5(0x14c)](_0x13e5d5(0x14b))?-0x1:0x0);return _0x21dc55==0x0&&(_0x21dc55=(_0x3d6d24[_0x13e5d5(0x138)][_0x13e5d5(0x14c)](_0x13e5d5(0x134))?0x1:0x0)-(_0x3ea00d['classList'][_0x13e5d5(0x14c)](_0x13e5d5(0x134))?0x1:0x0)),_0x21dc55*0x64+_0x2fe4f6*0xa+(_0x3d6d24['src']==_0x3ea00d[_0x13e5d5(0x132)]?0x0:_0x3d6d24[_0x13e5d5(0x132)]>_0x3ea00d[_0x13e5d5(0x132)]?0x1:-0x1);});for(_0x52e2ee=0x0;_0x52e2ee<_0x1f8a8c[_0x587a9a(0x176)];++_0x52e2ee){_0x51a573[_0x587a9a(0x158)](_0x1f8a8c[_0x52e2ee]);}}),_0x3563b3['querySelector'](_0x8eee96(0x144))['addEventListener'](_0x8eee96(0x133),()=>{const _0x4dc0e0=_0x8eee96;deck=_0x4dc0e0(0x17b),_0x3563b3[_0x4dc0e0(0x121)](_0x4dc0e0(0x15f))['forEach'](_0x158abb=>{const _0x35097a=_0x4dc0e0;deck+=_0x158abb[_0x35097a(0x179)]('data-id')+'\x0a';}),deck+='#extra\x0a',_0x3563b3[_0x4dc0e0(0x121)](_0x4dc0e0(0x17d))['forEach'](_0x141bd5=>{deck+=_0x141bd5['getAttribute']('data-id')+'\x0a';}),deck+='!side\x0a',_0x3edcf7(_0x4dc0e0(0x175),deck);}),_0x3563b3['querySelector']('#select-all')[_0x8eee96(0x131)]('click',()=>{const _0x5dd01e=_0x8eee96;_0x3563b3['querySelectorAll']('.card-thumbnail:not(.selected)')[_0x5dd01e(0x11d)](_0x1d39c7=>{const _0x196d64=_0x5dd01e;_0x1d39c7[_0x196d64(0x133)]();});});};_0x40f7e7(_0x4a11f1[_0x326196(0x140)]);};main();

*/
