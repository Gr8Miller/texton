# TypeScript library starter

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A js/ts library project that enables you to 
* serialize user `Selection`/dom `Range` into simple pojos and persist it somewhere;
* deserialize/restore user `Selection`/dom `Range` on web pages from pojos 
extremely easy.

It is especially useful to make WYSIWYG apps or webpage tagging, annotating and bookmarking 
tools like 
[Anylink](https://chrome.google.com/webstore/detail/any-link-safereliable-lin/mpflpgaobfpjcpefkdnpalfdodifkkgc), 
[Diigo](https://chrome.google.com/webstore/detail/diigo-web-collector-captu/pnhplgjpclknigjpccbcnmicgcieojbh)...

## Usage

```bash
npm install texton -S
```

**Start coding!**

### Concepts
 - `XSelection` is the core class, which encapsulates the native `Selection`/`Range` and provides 
 rich methods on serializing user `Selection` and restoring user `Selection`/`XSelection` from 
 different types of serialized data.
 
 - `XDocument` constructs the context of `XSelection`, that is the scope where `XSelection` should 
 work.

### Importing library

#### ES6
```typescript
import {XDocument, XSelection} from 'texton';
const doc = XDocument.from(document.querySelector('#content'));
```

#### AMD
```xhtml
<html>
  <head>
      <script type="text/javascript" src="path/to/texton.umd.js"></script>
  </head>
  <body>
    <!-- ... -->
    <div id="content">
    <!-- ... -->
    </div>
    <!-- ... -->
    <script>
      const {XDocument, XSelection} = texton;
      const doc = XDocument.from(document.querySelector('#content'));
      function serialize(){
        let selection = window.getSelection();
        const xSelection = doc.fromSelection(selection);
        const serialized = xSelection.getTextRange();
          
        // store(serialized);      
      } 
      
      function restore(serialized){
        // const stored = StorageService.get();
        const xSelection = XSelection.fromTextRange(serialized, true, doc);
        const selection = window.getSelection(); // native selection
      }   

      function highlight(serialized){
        const xSelection = XSelection.fromTextRange(serialized, true, doc);
        const textNodes = xSelection.texts;
        textNodes.forEach((text) => {
          const $mark = document.createElement('em');
          $mark.classList.add('markup');
          text.replaceWith($mark);
          $mark.appendChild(text);
        });
      }   
    </script>
  </body>
</html>
```
### Features 


## Projects using `texton`

Here are some projects that are using `texton`:
- [Anylink - Linkify/Highlight Any Text on Any Web Pages](https://chrome.google.com/webstore/detail/any-link-safereliable-lin/mpflpgaobfpjcpefkdnpalfdodifkkgc)

## Credits

Made with :heart: by [Miller](mailto:gr8miller@hotmail.com)
