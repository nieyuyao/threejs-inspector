## A chrome inspector for three.js

<p align="center"><img src="https://s.momocdn.com/w/u/others/2019/01/15/1547552791926-three-devtool-screen-shot.png" alt="screenshot"></p>

## Installation

Since it is not uploaded to the chrome extension store, it needs to be installed in the following way:

1. Clone this repository to your local 

```javascript
git clone
```

2. Switch to the directory and execute the command

```javascript
npm run build
```

3. As shown below

<p align="center"><img src="https://s.momocdn.com/w/u/others/2019/01/15/1547553288258-three-devtool-install-1.png" alt="screenshot"></p>

<p align="center"><img src="
https://s.momocdn.com/w/u/others/2019/01/15/1547553896475-three-devtool-install-2.png" alt="screenshot"></p>

## Note

1. If you want to inspect a three.js scene, you should expose <code>THREE</code> to the <code>window</code>.

```javascript
window.THREE = THREE;
```

2. Add <code>$$RendererList</code> to <code>window.THREE</code>.

```javascript
window.THREE.$$RendererList = [];
```

3. Add <code>renderer</code> to inspect to <code>$$RendererList</code>.

```javascript
window.THREE.$$RendererList.push(renderer);
```
