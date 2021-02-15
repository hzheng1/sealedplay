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
				const rarity = rowText[rarityIndex].split('\n');
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
		card.rarity.forEach((rarity) => {
			if (!(rarity in cardsByRarity)) {
				cardsByRarity[rarity] = [];
			}
			cardsByRarity[rarity].push(card);
		});
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
					let commons = cardsByRarity['Common'];
					let rares = cardsByRarity['Rare'];
					return [
						randomElem(rares),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(cards),
					];
				};
			case 'Battle_Pack_3:_Monster_League':
				return () => {
					let commons = cardsByRarity['Common'];
					let rares = cardsByRarity['Rare'];
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
javascript:(function(){ const _0x50d7=['passcode','Slifer\x20the\x20Sky\x20Dragon','2841tXmNha','download','then','Battle_Pack_2:_War_of_the_Giants','thead\x20th','#extra\x0a','push','src','12606xEDhnJ','\x0a<style\x20type=\x22text/css\x22>\x0a\x09.column\x20{\x0a\x09\x20\x20float:\x20left;\x0a\x09}\x0a\x0a\x09.left\x20{\x0a\x09\x20\x20width:\x2075%;\x0a\x09}\x0a\x0a\x09#main\x20{\x0a\x09\x09overflow-y:\x20scroll;\x0a\x09\x20\x20height:\x2095%;\x0a\x09}\x0a\x0a\x09.right\x20{\x0a\x09\x20\x20width:\x2025%;\x0a\x09}\x0a\x0a\x09.card-thumbnail\x20{\x0a\x09\x09width:\x20144px;\x0a\x09\x09margin:\x208px;\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip1\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(0,\x201);\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip2\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(1,\x201);\x0a\x09}\x0a\x0a\x09.selected.extra\x20{\x0a\x09\x09outline:\x204px\x20solid\x20blue;\x0a\x09}\x0a\x0a\x09.selected\x20{\x0a\x09\x09outline:\x204px\x20solid\x20red;\x0a\x09}\x0a</style>\x0a<div\x20class=\x22row\x22>\x0a\x09<div\x20class=\x22column\x20left\x22\x20>\x0a\x09\x09<button\x20id=\x22add\x22>\x0a\x09\x09\x09Open\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22add-shown\x22>\x0a\x09\x09\x09Open\x20Revealed\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22sort\x22>\x0a\x09\x09\x09Sort\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22export\x22>\x0a\x09\x09\x09Export\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22select-all\x22>\x0a\x09\x09\x09Click\x20All\x0a\x09\x09</button>\x0a\x09\x09<br\x20/>\x0a\x09\x09<div\x20id=\x22main\x22>\x0a\x09\x09</div>\x0a\x09</div>\x0a\x09<div\x20class=\x22column\x20right\x22>\x0a\x09\x09<img\x20id=\x22preview\x22\x20width=\x22100%\x22></img>\x0a\x09</div>\x0a</div>','join','document','filter','slice','innerText','2VShszb','removeEventListener','text','addEventListener','.extra','#preview','#main','.selected','add','Battle_Pack_3:_Monster_League','style','Rare','host','replace','trim','protocol','sealedplay.ydk','extra','div','href','parentElement','flip1','match','1916496ExQOHy','Sealed\x20Play\x20Card\x20Selector','transitionend','prototype','map','https://yugioh.fandom.com/wiki/','234989mvBBrm','<img\x20class=\x22card-thumbnail\x20','indexOf','Common','368879JLqqXm','table','#main\x0a','category','1CRrrAW','title','remove','getAttribute','\x22\x20data-id=\x22','innerHTML','#export','468131Cimnxs','all','Battle_Pack:_Epic_Dawn','.selected.extra','North\x20American','selected','12zQaxaU','length','click','314240NqCxJo','1RMcRvO','appendChild','set\x20number','pathname','setAttribute','body','#sort','has','!side\x0a','querySelector','.card-thumbnail:not(.selected)','contains','cardNumber','createElement','toLowerCase','sort','3BbbSMa','flip2','display','data-id','nodeType','firstChild','179KYsQVy','split','#add-shown','forEach','https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133','call','open','image','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes','card\x20number','mouseover','rarity','English','classList','querySelectorAll','Obelisk\x20the\x20Tormentor','scrollTo','#add','removeChild'];const _0x5610=function(_0x90a1d8,_0x855479){_0x90a1d8=_0x90a1d8-0x17d;let _0x50d787=_0x50d7[_0x90a1d8];return _0x50d787;};(function(_0x2246a3,_0x167fbb){const _0x479af7=_0x5610;while(!![]){try{const _0x55bb51=-parseInt(_0x479af7(0x19e))*-parseInt(_0x479af7(0x1a8))+parseInt(_0x479af7(0x18f))*parseInt(_0x479af7(0x1e2))+parseInt(_0x479af7(0x1be))*parseInt(_0x479af7(0x1d3))+parseInt(_0x479af7(0x1a7))*parseInt(_0x479af7(0x197))+-parseInt(_0x479af7(0x1b8))*-parseInt(_0x479af7(0x193))+-parseInt(_0x479af7(0x1a4))*parseInt(_0x479af7(0x1db))+-parseInt(_0x479af7(0x189));if(_0x55bb51===_0x167fbb)break;else _0x2246a3['push'](_0x2246a3['shift']());}catch(_0x5879b6){_0x2246a3['push'](_0x2246a3['shift']());}}}(_0x50d7,0xc340d));let main=async()=>{const _0x38aac0=_0x5610;let _0x13014c=async()=>{const _0x3b40c0=_0x5610,_0x6d20e0=Array[_0x3b40c0(0x18c)]['slice'][_0x3b40c0(0x1c3)](document[_0x3b40c0(0x1cc)](_0x3b40c0(0x194))),_0x51f05e=_0x6d20e0[_0x3b40c0(0x1df)](_0x3b2c71=>{const _0x1fb1ac=_0x3b40c0,_0x17aa9d=_0x3b2c71[_0x1fb1ac(0x186)][_0x1fb1ac(0x198)][_0x1fb1ac(0x180)]();if(_0x17aa9d!=_0x1fb1ac(0x1ca)&&_0x17aa9d!='North\x20American')return![];const _0x3ac290=new Set(Array[_0x1fb1ac(0x18c)][_0x1fb1ac(0x1e0)][_0x1fb1ac(0x1c3)](_0x3b2c71[_0x1fb1ac(0x1cc)](_0x1fb1ac(0x1d7)))['map'](_0x54c3fa=>_0x54c3fa[_0x1fb1ac(0x1e1)][_0x1fb1ac(0x180)]()[_0x1fb1ac(0x1b6)]()));return(_0x3ac290[_0x1fb1ac(0x1af)](_0x1fb1ac(0x1c7))||_0x3ac290[_0x1fb1ac(0x1af)](_0x1fb1ac(0x1aa)))&&_0x3ac290['has'](_0x1fb1ac(0x1c9))&&_0x3ac290[_0x1fb1ac(0x1af)]('category');});_0x51f05e['sort']((_0x26aa01,_0x3ea907)=>{return score=_0xb6a476=>{const _0x31ceb1=_0x5610;switch(_0xb6a476[_0x31ceb1(0x186)][_0x31ceb1(0x198)][_0x31ceb1(0x180)]()){case _0x31ceb1(0x1ca):return 0x0;case _0x31ceb1(0x1a2):return 0x1;default:return 0x2;}},score(_0x26aa01)-score(_0x3ea907);});const _0x295590=_0x51f05e[0x0],_0x28411c=Array[_0x3b40c0(0x18c)][_0x3b40c0(0x1e0)][_0x3b40c0(0x1c3)](_0x295590[_0x3b40c0(0x1cc)](_0x3b40c0(0x1d7)))[_0x3b40c0(0x18d)](_0x362d49=>_0x362d49[_0x3b40c0(0x1e1)][_0x3b40c0(0x180)]()[_0x3b40c0(0x1b6)]());let _0x9781e3=_0x28411c[_0x3b40c0(0x191)](_0x3b40c0(0x1c7));_0x9781e3==-0x1&&(_0x9781e3=_0x28411c[_0x3b40c0(0x191)](_0x3b40c0(0x1aa)));const _0x528bb4=_0x28411c[_0x3b40c0(0x191)](_0x3b40c0(0x1c9)),_0x2eaac0=_0x28411c[_0x3b40c0(0x191)](_0x3b40c0(0x196)),_0x4b58d1=[],_0x57ed14=Array['prototype'][_0x3b40c0(0x1e0)][_0x3b40c0(0x1c3)](_0x295590[_0x3b40c0(0x1cc)]('tbody\x20tr'))[_0x3b40c0(0x18d)](_0x1ac868=>{const _0x2fbab0=_0x3b40c0,_0x11b327=Array['prototype']['slice'][_0x2fbab0(0x1c3)](_0x1ac868['querySelectorAll']('td'))[_0x2fbab0(0x18d)](_0x446654=>_0x446654[_0x2fbab0(0x1e1)]),_0xfe1245=_0x11b327[_0x9781e3],_0x2325af=_0x11b327[_0x528bb4][_0x2fbab0(0x1bf)]('\x0a'),_0x285411=_0x11b327[_0x2eaac0][_0x2fbab0(0x1b6)]();return fetch(_0x2fbab0(0x18e)+_0xfe1245)[_0x2fbab0(0x1d5)](_0x3ee25c=>_0x3ee25c[_0x2fbab0(0x1e4)]())[_0x2fbab0(0x1d5)](_0x274e15=>{const _0xf024b3=_0x2fbab0,_0x276f09=_0x274e15[_0xf024b3(0x188)](/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/)[0x1],_0x26af33=_0x274e15[_0xf024b3(0x188)](/<title>([^<]+)<\/title>/)[0x1][_0xf024b3(0x1bf)]('|')[0x0][_0xf024b3(0x180)]();switch(_0x26af33){}const _0x2d885d=(()=>{const _0x8cdb85=_0xf024b3;switch(_0x26af33){case _0x8cdb85(0x1cd):return'10000001';case _0x8cdb85(0x1d2):return'10000021';case'The\x20Winged\x20Dragon\x20of\x20Ra':return'10000011';default:return _0x274e15[_0x8cdb85(0x188)](/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[0x1];}})();_0x4b58d1[_0xf024b3(0x1d9)]({'cardNumber':_0xfe1245,'rarity':_0x2325af,'isExtra':!!_0x285411[_0xf024b3(0x188)](/(?:fusion|synchro|xyz|link)/),'image':_0x276f09,'passcode':_0x2d885d});});});return Promise[_0x3b40c0(0x19f)](_0x57ed14)[_0x3b40c0(0x1d5)](()=>{const _0x12bdb4=_0x3b40c0;return _0x4b58d1[_0x12bdb4(0x1b7)]((_0x578b9d,_0xd2bf82)=>_0x578b9d[_0x12bdb4(0x1b4)]['localeCompare'](_0xd2bf82[_0x12bdb4(0x1b4)]));});},_0x56c44f=await _0x13014c(),_0x13ddf3={};_0x56c44f[_0x38aac0(0x1c1)](_0x1d4191=>{const _0x19c096=_0x38aac0;_0x1d4191[_0x19c096(0x1c9)][_0x19c096(0x1c1)](_0x28ff80=>{const _0x3f64b1=_0x19c096;!(_0x28ff80 in _0x13ddf3)&&(_0x13ddf3[_0x28ff80]=[]),_0x13ddf3[_0x28ff80][_0x3f64b1(0x1d9)](_0x1d4191);});});let _0x2a76ae=_0x38aac0(0x1dc),_0x4db895=()=>{const _0x43a184=_0x38aac0,_0x812cd7=_0x1c5654=>{const _0x37a0c0=_0x5610;return _0x1c5654[Math['floor'](Math['random']()*_0x1c5654[_0x37a0c0(0x1a5)])];},_0x30a81e=[location[_0x43a184(0x181)],'//',location[_0x43a184(0x17e)],location[_0x43a184(0x1ab)]][_0x43a184(0x1dd)]('')[_0x43a184(0x17f)](_0x43a184(0x18e),'');switch(_0x30a81e){case _0x43a184(0x1a0):return()=>{const _0x15f7bc=_0x43a184;let _0x586d3e=_0x56c44f[_0x15f7bc(0x1e0)](0x0,0x37),_0x326077=_0x56c44f[_0x15f7bc(0x1e0)](0x37,0x6e),_0x490390=_0x56c44f['slice'](0x6e,0xaa),_0x11a5c3=_0x56c44f[_0x15f7bc(0x1e0)](0xaa);return[_0x812cd7(_0x586d3e),_0x812cd7(_0x326077),_0x812cd7(_0x490390),_0x812cd7(_0x11a5c3),_0x812cd7(_0x56c44f)];};case _0x43a184(0x1d6):return()=>{const _0x930745=_0x43a184;let _0x465fc5=_0x13ddf3[_0x930745(0x192)],_0x59ea7e=_0x13ddf3[_0x930745(0x17d)];return[_0x812cd7(_0x59ea7e),_0x812cd7(_0x465fc5),_0x812cd7(_0x465fc5),_0x812cd7(_0x465fc5),_0x812cd7(_0x56c44f)];};case _0x43a184(0x1eb):return()=>{const _0xe88c8c=_0x43a184;let _0x138488=_0x13ddf3[_0xe88c8c(0x192)],_0x546c50=_0x13ddf3[_0xe88c8c(0x17d)];return[_0x812cd7(_0x546c50),_0x812cd7(_0x138488),_0x812cd7(_0x138488),_0x812cd7(_0x138488),_0x812cd7(_0x56c44f)];};default:return()=>{const _0x4d75b4=_0x43a184;let _0x3ff9f1=_0x13ddf3[_0x4d75b4(0x192)],_0x5aad9b=_0x13ddf3[_0x4d75b4(0x17d)],_0x19a135=[];for(let _0x5946f2 in _0x13ddf3){if(_0x5946f2=='Common'||_0x5946f2=='Rare')continue;_0x19a135[_0x4d75b4(0x1d9)](..._0x13ddf3[_0x5946f2]);}return[_0x812cd7(_0x3ff9f1),_0x812cd7(_0x3ff9f1),_0x812cd7(_0x3ff9f1),_0x812cd7(_0x3ff9f1),_0x812cd7(_0x3ff9f1),_0x812cd7(_0x3ff9f1),_0x812cd7(_0x3ff9f1),_0x812cd7(_0x5aad9b),_0x812cd7(_0x19a135)];};}},_0xbd8806=_0x4db895(),_0x2fc02e=window[_0x38aac0(0x1c4)]('',_0x38aac0(0x18a),_0x38aac0(0x1c6));_0x2fc02e[_0x38aac0(0x1de)]['body'][_0x38aac0(0x19c)]=_0x2a76ae;let _0x483cfe=_0x473088=>{const _0x29082d=_0x38aac0,_0x3b4165=_0x29082d(0x1c2),_0x141138=(_0x2632f7,_0x2762be)=>{const _0x2125da=_0x29082d;let _0x537b9f=_0x473088[_0x2125da(0x1b5)]('a');_0x537b9f[_0x2125da(0x1ac)](_0x2125da(0x185),'data:text/plain;charset=utf-8,'+encodeURIComponent(_0x2762be)),_0x537b9f[_0x2125da(0x1ac)](_0x2125da(0x1d4),_0x2632f7),_0x537b9f[_0x2125da(0x1ec)][_0x2125da(0x1ba)]='none',_0x473088[_0x2125da(0x1ad)][_0x2125da(0x1a9)](_0x537b9f),_0x537b9f[_0x2125da(0x1a6)](),_0x473088[_0x2125da(0x1ad)][_0x2125da(0x1d0)](_0x537b9f);},_0x20d899=_0x38194f=>{const _0x19d778=_0x29082d,_0x4b1aef=_0x473088[_0x19d778(0x1b5)](_0x19d778(0x184));return _0x4b1aef['innerHTML']=_0x38194f[_0x19d778(0x180)](),_0x4b1aef[_0x19d778(0x1bd)];},_0x58021b=_0x332f71=>{const _0x1c61b2=_0x29082d;let _0x5c6a06=_0xbd8806();_0x5c6a06[_0x1c61b2(0x1c1)](_0x48da0b=>{const _0x36e49c=_0x1c61b2,_0x11eb18=_0x20d899(_0x36e49c(0x190)+(_0x48da0b['isExtra']?_0x36e49c(0x183):'')+_0x36e49c(0x19b)+_0x48da0b[_0x36e49c(0x1d1)]+'\x22\x20src=\x22'+(_0x332f71?_0x48da0b[_0x36e49c(0x1c5)]:_0x3b4165)+'\x22></img>');_0x11eb18[_0x36e49c(0x1e5)](_0x36e49c(0x1c8),()=>{const _0x5527e6=_0x36e49c;_0x473088['querySelector'](_0x5527e6(0x1e7))[_0x5527e6(0x1da)]=_0x11eb18[_0x5527e6(0x1da)];});var _0x2dd556=_0x332f71;_0x11eb18[_0x36e49c(0x1e5)](_0x36e49c(0x1a6),()=>{const _0x5ba421=_0x36e49c;if(!_0x2dd556)_0x11eb18[_0x5ba421(0x1cb)][_0x5ba421(0x1ea)](_0x5ba421(0x187)),animateEnd=()=>{const _0x42cbef=_0x5ba421;if(_0x11eb18[_0x42cbef(0x1cb)][_0x42cbef(0x1b3)](_0x42cbef(0x187)))_0x11eb18[_0x42cbef(0x1cb)][_0x42cbef(0x199)]('flip1'),_0x11eb18[_0x42cbef(0x1cb)]['add']('flip2'),_0x11eb18[_0x42cbef(0x1da)]=_0x48da0b[_0x42cbef(0x1c5)],_0x2dd556=!![];else _0x11eb18[_0x42cbef(0x1cb)][_0x42cbef(0x1b3)](_0x42cbef(0x1b9))&&(_0x11eb18[_0x42cbef(0x1cb)][_0x42cbef(0x199)]('flip2'),_0x11eb18[_0x42cbef(0x1e3)](_0x42cbef(0x18b),animateEnd));},_0x11eb18[_0x5ba421(0x1e5)](_0x5ba421(0x18b),animateEnd);else{if(_0x11eb18[_0x5ba421(0x1cb)][_0x5ba421(0x1b3)](_0x5ba421(0x1a3)))_0x11eb18[_0x5ba421(0x1cb)][_0x5ba421(0x199)](_0x5ba421(0x1a3));else{const _0x162016=_0x11eb18['classList']['contains'](_0x5ba421(0x183)),_0x1e2559=_0x473088[_0x5ba421(0x1cc)](_0x5ba421(0x1e9)+(_0x162016?_0x5ba421(0x1e6):''))['length'];(!_0x162016&&_0x1e2559<0x3c||_0x162016&&_0x1e2559<0xf)&&_0x11eb18[_0x5ba421(0x1cb)][_0x5ba421(0x1ea)](_0x5ba421(0x1a3));}}});const _0x475c1a=_0x473088[_0x36e49c(0x1b1)](_0x36e49c(0x1e8));_0x475c1a[_0x36e49c(0x1a9)](_0x11eb18),_0x475c1a[_0x36e49c(0x1ce)](0x0,_0x475c1a['scrollHeight']);});};_0x473088['querySelector'](_0x29082d(0x1cf))[_0x29082d(0x1e5)](_0x29082d(0x1a6),()=>{_0x58021b(![]);}),_0x473088[_0x29082d(0x1b1)](_0x29082d(0x1c0))['addEventListener']('click',()=>{_0x58021b(!![]);}),_0x473088['querySelector'](_0x29082d(0x1ae))[_0x29082d(0x1e5)](_0x29082d(0x1a6),()=>{const _0x2f699b=_0x29082d,_0x2f80c9=_0x473088[_0x2f699b(0x1b1)](_0x2f699b(0x1e8)),_0xa6b719=_0x2f80c9['childNodes'];let _0x432005=[];for(var _0x2097a8 in _0xa6b719){_0xa6b719[_0x2097a8][_0x2f699b(0x1bc)]==0x1&&_0x432005[_0x2f699b(0x1d9)](_0xa6b719[_0x2097a8]);}_0x432005[_0x2f699b(0x1b7)](function(_0x3e371f,_0x6bc91c){const _0x21df82=_0x2f699b,_0xee5a4=(_0x3e371f[_0x21df82(0x1da)]==_0x3b4165?0x1:0x0)-(_0x6bc91c[_0x21df82(0x1da)]==_0x3b4165?0x1:0x0);let _0x187289=(_0x3e371f[_0x21df82(0x1cb)][_0x21df82(0x1b3)](_0x21df82(0x1a3))?-0x1:0x0)-(_0x6bc91c[_0x21df82(0x1cb)][_0x21df82(0x1b3)](_0x21df82(0x1a3))?-0x1:0x0);return _0x187289==0x0&&(_0x187289=(_0x3e371f[_0x21df82(0x1cb)][_0x21df82(0x1b3)](_0x21df82(0x183))?0x1:0x0)-(_0x6bc91c[_0x21df82(0x1cb)][_0x21df82(0x1b3)]('extra')?0x1:0x0)),_0x187289*0x64+_0xee5a4*0xa+(_0x3e371f[_0x21df82(0x1da)]==_0x6bc91c[_0x21df82(0x1da)]?0x0:_0x3e371f[_0x21df82(0x1da)]>_0x6bc91c['src']?0x1:-0x1);});for(_0x2097a8=0x0;_0x2097a8<_0x432005[_0x2f699b(0x1a5)];++_0x2097a8){_0x2f80c9[_0x2f699b(0x1a9)](_0x432005[_0x2097a8]);}}),_0x473088[_0x29082d(0x1b1)](_0x29082d(0x19d))[_0x29082d(0x1e5)](_0x29082d(0x1a6),()=>{const _0x543920=_0x29082d;deck=_0x543920(0x195),_0x473088[_0x543920(0x1cc)]('.selected:not(.extra)')[_0x543920(0x1c1)](_0x5917a0=>{const _0x24d0bb=_0x543920;deck+=_0x5917a0['getAttribute'](_0x24d0bb(0x1bb))+'\x0a';}),deck+=_0x543920(0x1d8),_0x473088['querySelectorAll'](_0x543920(0x1a1))[_0x543920(0x1c1)](_0x1cbfa9=>{const _0x549fb0=_0x543920;deck+=_0x1cbfa9[_0x549fb0(0x19a)](_0x549fb0(0x1bb))+'\x0a';}),deck+=_0x543920(0x1b0),_0x141138(_0x543920(0x182),deck);}),_0x473088['querySelector']('#select-all')[_0x29082d(0x1e5)](_0x29082d(0x1a6),()=>{const _0x5002b0=_0x29082d;_0x473088[_0x5002b0(0x1cc)](_0x5002b0(0x1b2))[_0x5002b0(0x1c1)](_0x17a6f3=>{const _0x2dcd84=_0x5002b0;_0x17a6f3[_0x2dcd84(0x1a6)]();});});};_0x483cfe(_0x2fc02e[_0x38aac0(0x1de)]);};main(); })(); 

*/
