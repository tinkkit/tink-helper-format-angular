'use strict';
(function(module) {
  try {
    module = angular.module('tink.formathelper');
  } catch (e) {
    module = angular.module('tink.formathelper', ['tink.datehelper','tink.safeApply']);
  }
  module.controller('tinkFormatController',['$scope','safeApply',function($scope,safeApply){

    var self = this;
    var config;
    var format;
    var placeholder;
    var newVa;
    var deleteVal = -1;
    var controlKey = 0;
    var keyDowned = '';
    var prevValue;
    var pressedKeys = [];
    String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
    self.init = function(element,config,form,ngControl){
      self.element = element;
      self.config = config;
      self.form = form;
      self.ngControl = ngControl;
      loadAll();
    };

    function getFormat(regex){
      var ra = new RandExp(new RegExp(regex));
      var gens = [];
      for (var i = 0; i < 10; i++) {
        gens.push(ra.gen());
      };
    }
    
    function loadAll(){
      config = self.config;
      format = config.format;

      if(format && format.contains('00')){
        format = format.replace(/0/gi, '[0-9]');
        format = format.replace(/\//gi, '\/');
      }

      placeholder = config.placeholder;
      self.setValue(placeholder,null,null,false);
      newVa = placeholder;
      prevValue = placeholder;
      self.element.bind('drop',function(e){
        if(!self.isDisabled()){
          var value = e.originalEvent.dataTransfer.getData('Text');
          self.setValue(value);
          self.element.blur();
        }
        return false;
      })
      self.element.bind('keydown', function(event) {
        if(!self.isDisabled()){
          keyDowned = self.getValue();
          if(event.which ===91 || event.which === 92 || event.which === 93){
            controlKey = 1;
          }
          if((event.ctrlKey||event.metaKey) && event.which === 88){
            setTimeout(function() {
              self.setValue(placeholder);
            }, 1);
            return true;
          }
          if (event.which === 8) {
            handleBackspace();
            return false;

          } else if (event.which === 46) {
            handleDelete();
            return false;
          }
        }else{
          if((event.ctrlKey||event.metaKey) && event.which === 67){
            return true;
          }
          event.preventDefault();
          event.stopPropagation();
        }
      });
      self.element.bind('keyup', function(event) {
        if(!self.isDisabled()){
          if(event.which ===91 || event.which === 92 || event.which === 93){
            controlKey = 0;
          }
        }
      });

      self.element.bind('focusin', function(event) {
        if(self.isDisabled() && self.getValue() !== placeholder){
          event.preventDefault();
          event.stopPropagation();
        }
      });
      self.element.bind('mousedown', function(evt) {
        if(!self.isDisabled()){
          setTimeout(function() {
            if (placeholder === newVa) {
              setCursor(0);
            }
          }, 1);
        }else{
          if(self.getValue() === placeholder){
            return false;
          }
        }
      });

      self.element.bind('focus',function(){
        setTimeout(function(){
          if(!self.isDisabled()){
            var pos = firstCh();
            if(pos !== config.placeholder.length){
              setCursor(firstCh());
            }
          }          
        },5);
      });

      

      self.element.bind('paste', function (e) {
        if(!self.isDisabled()){
          var cursor = getCaretSelection();
          e.preventDefault();
          var text = (e.originalEvent || e).clipboardData.getData('text/plain');
          window.document.execCommand('insertText', false, text);
          self.setValue(keyDowned);
          for(var i=0;i<text.length;i++){
            handleInput(text[i],cursor);
            cursor++;
          }
        }
      });

      self.element.keypress(function(event) {
        if(!self.isDisabled()){
          if(!controlKey){
            var key = String.fromCharCode(event.which);
            handleInput(key);
            return false;
          }
        }
      });

      if(self.form){
        //setTimeout(function(){ self.form.$addControl(self.ngControl); }, 0);
      }

    }
    String.prototype.replaceAt = function(index, character) {
      return this.substr(0, index) + character + this.substr(index + character.length);
    };
    String.prototype.replaceRange = function(start, stop, value) {
      return this.substr(0, start) + value.substr(start, stop - start) + this.substr(stop);
    };

    function handleInput(key, cur) { 
      var cursor;
      var selection;
      if (!cur) {
        cursor = getCaretSelection().start;
        selection = getCaretSelection().end;
      } else {
        cursor = cur.start;
        selection = cur.end;
      }

      var ra = new RandExp(new RegExp(format));
      var placeFormat = ra.gen();
     
      if(/^[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(placeFormat[cursor])){
        cursor += 1;
        selection+=1;
      }
      if(/[A-Z]/.test( placeFormat[cursor])){
        key = key.toUpperCase();
      }

      if (cursor > -1 && cursor < placeFormat.length) {
          if (charIs(key, cursor)) {
            if (cursor !== selection) {
              newVa = newVa.replaceRange(cursor, selection, placeholder);
            }
            newVa = newVa.replaceAt(cursor, key);
            cursor += 1;
          } else {
            newVa = newVa.replaceRange(cursor, selection, placeholder);
          }
      }
      deleteVal = -1;
      self.setValue(newVa,cursor);
    }

    function handleBackspace() {
      var cursor = getCaretSelection();
      if (cursor.start === cursor.end && cursor.start > 0) {
        newVa = newVa.replaceAt(cursor.start - 1, placeholder[cursor.start - 1]);
        self.setValue(newVa,cursor.start - 1);
      } else {
        newVa = newVa.replaceRange(cursor.start, cursor.end, placeholder);
        self.setValue(newVa,cursor.start);
      }

    }

    function handleDelete() {
      var cursor = getCaretSelection();
      if (cursor.start === cursor.end) {
        var pos = cursor.start;
        while (placeholder[cursor.start] === newVa[cursor.start] && cursor.start < placeholder.length - 1) {
          cursor.start++;
        }
        newVa = newVa.replaceAt(cursor.start, placeholder[cursor.start]);
        self.setValue(newVa,pos);

      } else {
        newVa = newVa.replaceRange(cursor.start, cursor.end, placeholder);
        self.setValue(newVa,cursor.start);
      }
    }

    function firstCh(){
      return 0 ;
      if(newVa){
        for(var i=0;i<newVa.length;i++){
          if(newVa.length === format.length){
            if(format[i] === '0'){
              if(newVa[i] >-1 && newVa[i] < 10){

              }else{
                return i;
              }
            }
          }else{
            return 0;
          }
        }
        return newVa.length;
      }
    }

    function valueToHtml(value) {
      var html = '';                // weekDaysLabels.join('</th><th class="dow text-center">') + '</th>')
      var plHtml = '<span class="placeholder">';
      var plEHtml = '</span>';
      var open = 0;
      for (var i = 0; i < placeholder.length; i++) {
        if (placeholder[i] === value[i]) {
          if (open === 0) {
            html += plHtml + value[i];
            open = 1;
          } else if (open === 1) {
            html += value[i];
          }
        } else {
          if (open === 1) {
            html += plEHtml + value[i];
            open = 0;
          } else {
            html += value[i];
          }
        }
      }
      if (open === 1) {
        html += plEHtml;
      }
      return html;
  }

  self.disableElements = function(el) {
    if(el){
      for (var i = 0; i < el.length; i++) {
        $(el[i]).attr('disabled', 'disabled');
        //$(el[i]).attr('tabindex', '-1');
        self.disableElements($(el[i]).children());
      }
    }
  }

  self.enableElements = function(el) {
    if(el){
      for (var i = 0; i < el.length; i++) {
        $(el[i]).removeAttr('disabled', 'disabled');
       // $(el[i]).removeAttr('tabindex', '-1');
        self.enableElements($(el[i]).children());
      }
    }
  }

  self.isDisabled = function(){
    return $scope.isDisabled;
  }



  $scope.$watch(function(){return self.isDisabled();},function(newVal){
    if(newVal){
      self.disableElements(self.element);
      $(self.element).removeAttr('contenteditable');
    }else{
      self.enableElements(self.element);
      $(self.element).attr('contenteditable','true');
    }
  });

 

  self.setValue = function(value,cur,force,ignore) {
    if(!self.element[0]){
      return;
    }
    if(!force){
      if(value && value.length !== placeholder.length){
        newVa = placeholder;
      }else if(!value){
        newVa = placeholder;
      }else{
        newVa = value;
      }
    }else{
      newVa = value;
    }

    if(self.element[0].nodeName === 'DIV'){
      self.element.html(valueToHtml(newVa));
      if(self.isDisabled()){
        self.element.find('span').attr('disabled','disabled');
        self.element.find('span').unbind('mousedown')
      }
      if(prevValue !== newVa && ignore !== false){
        self.element.trigger('valueChanged',[newVa]);
      }
    }else{
      self.element.val(newVa);
      self.element.trigger('valueChanged',[newVa]);
    }
    if (cur && cur > -1 && cur <= format.length) {
      setCursor(cur);
    }
      prevValue = newVa;
  };

  self.getValue = function(){
    return newVa;
  };

  self.setCurs = function(){
    setCursor(0);
  }

  function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
  }

  function charIs(char, cur) {
    pressedKeys[cur] = char;
    var ra = new RandExp(new RegExp(format));
    var placeFormat = ra.gen();
    for(var i =0;i<= format.length;i++){
      if(pressedKeys[i]){
        placeFormat = placeFormat.replaceAt(i, pressedKeys[i]);
      }
    }
    return new RegExp(format).test(placeFormat);
  }

  function getCaretSelection() {
    var caretOffset = 0;
    var element = self.element.get(0);
    element.focus();
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    var startOffset;

    if (typeof win.getSelection !== 'undefined') {
      sel = win.getSelection();
      if (sel.rangeCount > 0) {
        var range = win.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
        startOffset = caretOffset - window.getSelection().toString().length;
      }
    } else if ((sel = doc.selection) && sel.type !== 'Control') {
      var textRange = sel.createRange();
      var preCaretTextRange = doc.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint('EndToEnd', textRange);
      caretOffset = preCaretTextRange.text.length;
      startOffset = caretOffset - document.selection.createRange().text.length;

    }
    return {
      start: startOffset,
      end: caretOffset
    };
  }

function setCursor(cur) {
  var el = self.element[0];
  var range = document.createRange();
  var sel = window.getSelection();
  var lengths = 0;
  var chosenChild = 0;
  for (var i = 0; i < self.element[0].childNodes.length; i++) {
    var node = self.element[0].childNodes[i];
    if (node.nodeName === '#text') {
      lengths += node.length;
      chosenChild = node;
    } else {
      lengths += node.childNodes[0].length;
      chosenChild = node.childNodes[0];
    }
    if (cur <= lengths) {
      cur = cur - (lengths - chosenChild.length);
      i = 9999;
    }
  }
  if(chosenChild !== 0){
    range.setStart(chosenChild, cur);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }  
  el.focus();
}

}]);
})();;//
// randexp v0.4.1
// Create random strings that match a given regular expression.
//
// Copyright (C) 2015 by Roly Fentanes (https://github.com/fent)
// MIT License
// http://github.com/fent/randexp.js/raw/master/LICENSE 
//
!function(){var e="RandExp",t=function(){return function e(t,n,r){function o(s,i){if(!n[s]){if(!t[s]){var u="function"==typeof require&&require;if(!i&&u)return u(s,!0);if(a)return a(s,!0);var p=new Error("Cannot find module '"+s+"'");throw p.code="MODULE_NOT_FOUND",p}var h=n[s]={exports:{}};t[s][0].call(h.exports,function(e){var n=t[s][1][e];return o(n?n:e)},h,h.exports,e,t,n,r)}return n[s].exports}for(var a="function"==typeof require&&require,s=0;s<r.length;s++)o(r[s]);return o}({1:[function(e,t,n){function r(e){return e+(e>=97&&122>=e?-32:e>=65&&90>=e?32:0)}function o(){return!this.randInt(0,1)}function a(e){return e instanceof p?e.index(this.randInt(0,e.length-1)):e[this.randInt(0,e.length-1)]}function s(e){if(e.type===u.types.CHAR)return new p(e.value);if(e.type===u.types.RANGE)return new p(e.from,e.to);if(e.type===u.types.SET){for(var t=new p,n=0;n<e.set.length;n++){var o=s.call(this,e.set[n]);if(t.add(o),this.ignoreCase)for(var a=0;a<o.length;a++){var i=o.index(a),h=r(i);i!==h&&t.add(h)}}return e.not?this.defaultRange.clone().subtract(t):t}throw new Error("unexpandable token type: "+e.type)}function i(e,t){var n,u,p,l,c;switch(e.type){case h.ROOT:case h.GROUP:if(e.notFollowedBy)return"";for(e.remember&&void 0===e.groupNumber&&(e.groupNumber=t.push(null)-1),n=e.options?a.call(this,e.options):e.stack,u="",l=0,c=n.length;c>l;l++)u+=i.call(this,n[l],t);return e.remember&&(t[e.groupNumber]=u),u;case h.POSITION:return"";case h.SET:var f=s.call(this,e);return f.length?String.fromCharCode(a.call(this,f)):"";case h.REPETITION:for(p=this.randInt(e.min,e.max===1/0?e.min+this.max:e.max),u="",l=0;p>l;l++)u+=i.call(this,e.value,t);return u;case h.REFERENCE:return t[e.value-1]||"";case h.CHAR:var g=this.ignoreCase&&o.call(this)?r(e.value):e.value;return String.fromCharCode(g)}}var u=e("ret"),p=e("discontinuous-range"),h=u.types,l=t.exports=function(e,t){if(this.defaultRange=this.defaultRange.clone(),e instanceof RegExp)this.ignoreCase=e.ignoreCase,this.multiline=e.multiline,"number"==typeof e.max&&(this.max=e.max),e=e.source;else{if("string"!=typeof e)throw new Error("Expected a regexp or string");this.ignoreCase=t&&-1!==t.indexOf("i"),this.multiline=t&&-1!==t.indexOf("m")}this.tokens=u(e)};l.prototype.max=100,l.prototype.gen=function(){return i.call(this,this.tokens,[])},l.randexp=function(e,t){var n;return void 0===e._randexp?(n=new l(e,t),e._randexp=n):(n=e._randexp,"number"==typeof e.max&&(n.max=e.max),e.defaultRange instanceof p&&(n.defaultRange=e.defaultRange),"function"==typeof e.randInt&&(n.randInt=e.randInt)),n.gen()},l.sugar=function(){RegExp.prototype.gen=function(){return l.randexp(this)}},l.prototype.defaultRange=new p(32,126),l.prototype.randInt=function(e,t){return e+Math.floor(Math.random()*(1+t-e))}},{"discontinuous-range":2,ret:3}],2:[function(e,t,n){function r(e,t){this.low=e,this.high=t,this.length=1+t-e}function o(e,t){return this instanceof o?(this.ranges=[],this.length=0,void 0!==e&&this.add(e,t),void 0):new o(e,t)}function a(e){e.length=e.ranges.reduce(function(e,t){return e+t.length},0)}r.prototype.overlaps=function(e){return!(this.high<e.low||this.low>e.high)},r.prototype.touches=function(e){return!(this.high+1<e.low||this.low-1>e.high)},r.prototype.add=function(e){return this.touches(e)&&new r(Math.min(this.low,e.low),Math.max(this.high,e.high))},r.prototype.subtract=function(e){return this.overlaps(e)?e.low<=this.low&&e.high>=this.high?[]:e.low>this.low&&e.high<this.high?[new r(this.low,e.low-1),new r(e.high+1,this.high)]:e.low<=this.low?[new r(e.high+1,this.high)]:[new r(this.low,e.low-1)]:!1},r.prototype.toString=function(){return this.low==this.high?this.low.toString():this.low+"-"+this.high},r.prototype.clone=function(){return new r(this.low,this.high)},o.prototype.add=function(e,t){function n(e){for(var t=[],n=0;n<s.ranges.length&&!e.touches(s.ranges[n]);)t.push(s.ranges[n].clone()),n++;for(;n<s.ranges.length&&e.touches(s.ranges[n]);)e=e.add(s.ranges[n]),n++;for(t.push(e);n<s.ranges.length;)t.push(s.ranges[n].clone()),n++;s.ranges=t,a(s)}var s=this;return e instanceof o?e.ranges.forEach(n):e instanceof r?n(e):(void 0===t&&(t=e),n(new r(e,t))),this},o.prototype.subtract=function(e,t){function n(e){for(var t=[],n=0;n<s.ranges.length&&!e.overlaps(s.ranges[n]);)t.push(s.ranges[n].clone()),n++;for(;n<s.ranges.length&&e.overlaps(s.ranges[n]);)t=t.concat(s.ranges[n].subtract(e)),n++;for(;n<s.ranges.length;)t.push(s.ranges[n].clone()),n++;s.ranges=t,a(s)}var s=this;return e instanceof o?e.ranges.forEach(n):e instanceof r?n(e):(void 0===t&&(t=e),n(new r(e,t))),this},o.prototype.index=function(e){for(var t=0;t<this.ranges.length&&this.ranges[t].length<=e;)e-=this.ranges[t].length,t++;return t>=this.ranges.length?null:this.ranges[t].low+e},o.prototype.toString=function(){return"[ "+this.ranges.join(", ")+" ]"},o.prototype.clone=function(){return new o(this)},t.exports=o},{}],3:[function(e,t,n){var r=e("./util"),o=e("./types"),a=e("./sets"),s=e("./positions");t.exports=function(e){var t,n,i=0,u={type:o.ROOT,stack:[]},p=u,h=u.stack,l=[],c=function(t){r.error(e,"Nothing to repeat at column "+(t-1))},f=r.strToChars(e);for(t=f.length;t>i;)switch(n=f[i++]){case"\\":switch(n=f[i++]){case"b":h.push(s.wordBoundary());break;case"B":h.push(s.nonWordBoundary());break;case"w":h.push(a.words());break;case"W":h.push(a.notWords());break;case"d":h.push(a.ints());break;case"D":h.push(a.notInts());break;case"s":h.push(a.whitespace());break;case"S":h.push(a.notWhitespace());break;default:/\d/.test(n)?h.push({type:o.REFERENCE,value:parseInt(n,10)}):h.push({type:o.CHAR,value:n.charCodeAt(0)})}break;case"^":h.push(s.begin());break;case"$":h.push(s.end());break;case"[":var g;"^"===f[i]?(g=!0,i++):g=!1;var y=r.tokenizeClass(f.slice(i),e);i+=y[1],h.push({type:o.SET,set:y[0],not:g});break;case".":h.push(a.anyChar());break;case"(":var d={type:o.GROUP,stack:[],remember:!0};n=f[i],"?"===n&&(n=f[i+1],i+=2,"="===n?d.followedBy=!0:"!"===n?d.notFollowedBy=!0:":"!==n&&r.error(e,"Invalid group, character '"+n+"' after '?' at column "+(i-1)),d.remember=!1),h.push(d),l.push(p),p=d,h=d.stack;break;case")":0===l.length&&r.error(e,"Unmatched ) at column "+(i-1)),p=l.pop(),h=p.options?p.options[p.options.length-1]:p.stack;break;case"|":p.options||(p.options=[p.stack],delete p.stack);var v=[];p.options.push(v),h=v;break;case"{":var R,w,C=/^(\d+)(,(\d+)?)?\}/.exec(f.slice(i));null!==C?(R=parseInt(C[1],10),w=C[2]?C[3]?parseInt(C[3],10):1/0:R,i+=C[0].length,h.push({type:o.REPETITION,min:R,max:w,value:h.pop()})):h.push({type:o.CHAR,value:123});break;case"?":0===h.length&&c(i),h.push({type:o.REPETITION,min:0,max:1,value:h.pop()});break;case"+":0===h.length&&c(i),h.push({type:o.REPETITION,min:1,max:1/0,value:h.pop()});break;case"*":0===h.length&&c(i),h.push({type:o.REPETITION,min:0,max:1/0,value:h.pop()});break;default:h.push({type:o.CHAR,value:n.charCodeAt(0)})}return 0!==l.length&&r.error(e,"Unterminated group"),u},t.exports.types=o},{"./positions":4,"./sets":5,"./types":6,"./util":7}],4:[function(e,t,n){var r=e("./types");n.wordBoundary=function(){return{type:r.POSITION,value:"b"}},n.nonWordBoundary=function(){return{type:r.POSITION,value:"B"}},n.begin=function(){return{type:r.POSITION,value:"^"}},n.end=function(){return{type:r.POSITION,value:"$"}}},{"./types":6}],5:[function(e,t,n){var r=e("./types"),o=function(){return[{type:r.RANGE,from:48,to:57}]},a=function(){return[{type:r.CHAR,value:95},{type:r.RANGE,from:97,to:122},{type:r.RANGE,from:65,to:90}].concat(o())},s=function(){return[{type:r.CHAR,value:9},{type:r.CHAR,value:10},{type:r.CHAR,value:11},{type:r.CHAR,value:12},{type:r.CHAR,value:13},{type:r.CHAR,value:32},{type:r.CHAR,value:160},{type:r.CHAR,value:5760},{type:r.CHAR,value:6158},{type:r.CHAR,value:8192},{type:r.CHAR,value:8193},{type:r.CHAR,value:8194},{type:r.CHAR,value:8195},{type:r.CHAR,value:8196},{type:r.CHAR,value:8197},{type:r.CHAR,value:8198},{type:r.CHAR,value:8199},{type:r.CHAR,value:8200},{type:r.CHAR,value:8201},{type:r.CHAR,value:8202},{type:r.CHAR,value:8232},{type:r.CHAR,value:8233},{type:r.CHAR,value:8239},{type:r.CHAR,value:8287},{type:r.CHAR,value:12288},{type:r.CHAR,value:65279}]},i=function(){return[{type:r.CHAR,value:10},{type:r.CHAR,value:13},{type:r.CHAR,value:8232},{type:r.CHAR,value:8233}]};n.words=function(){return{type:r.SET,set:a(),not:!1}},n.notWords=function(){return{type:r.SET,set:a(),not:!0}},n.ints=function(){return{type:r.SET,set:o(),not:!1}},n.notInts=function(){return{type:r.SET,set:o(),not:!0}},n.whitespace=function(){return{type:r.SET,set:s(),not:!1}},n.notWhitespace=function(){return{type:r.SET,set:s(),not:!0}},n.anyChar=function(){return{type:r.SET,set:i(),not:!0}}},{"./types":6}],6:[function(e,t,n){t.exports={ROOT:0,GROUP:1,POSITION:2,SET:3,RANGE:4,REPETITION:5,REFERENCE:6,CHAR:7}},{}],7:[function(e,t,n){var r=e("./types"),o=e("./sets"),a="@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?",s={0:0,t:9,n:10,v:11,f:12,r:13};n.strToChars=function(e){var t=/(\[\\b\])|\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z\[\\\]\^?])|([0tnvfr]))/g;return e=e.replace(t,function(e,t,n,r,o,i,u){var p=t?8:n?parseInt(n,16):r?parseInt(r,16):o?parseInt(o,8):i?a.indexOf(i):u?s[u]:void 0,h=String.fromCharCode(p);return/[\[\]{}\^$.|?*+()]/.test(h)&&(h="\\"+h),h})},n.tokenizeClass=function(e,t){for(var a,s,i=[],u=/\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(\])|(?:\\)?(.)/g;null!=(a=u.exec(e));)if(a[1])i.push(o.words());else if(a[2])i.push(o.ints());else if(a[3])i.push(o.whitespace());else if(a[4])i.push(o.notWords());else if(a[5])i.push(o.notInts());else if(a[6])i.push(o.notWhitespace());else if(a[7])i.push({type:r.RANGE,from:(a[8]||a[9]).charCodeAt(0),to:a[10].charCodeAt(0)});else{if(!(s=a[12]))return[i,u.lastIndex];i.push({type:r.CHAR,value:s.charCodeAt(0)})}n.error(t,"Unterminated character class")},n.error=function(e,t){throw new SyntaxError("Invalid regular expression: /"+e+"/: "+t)}},{"./sets":5,"./types":6}]},{},[1])}()(1);"function"==typeof define&&"object"==typeof define.amd?define(e,function(){return t}):"undefined"!=typeof window&&(window[e]=t)}();;'use strict';
(function(module) {
  try {
    module = angular.module('tink.formathelper');
  } catch (e) {
    module = angular.module('tink.formathelper', ['tink.datehelper','tink.safeApply']);
  }
  module.directive('tinkFormatInput', ['dateCalculator', '$window', 'safeApply', function(dateCalculator, $window, safeApply) {
    return {
      restrict: 'EA',
      replace: true,
      priority:99,
      controller:'tinkFormatController',
      controllerAs:'ctrl',
      scope:{
        minDate:'=?',
        maxDate:'=?',
        isDisabled:'=?'
      },
      require:['tinkFormatInput','ngModel','?^form'],
      template: function() {
        var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
        var isTouch = ('createTouch' in $window.document) && isNative;
        if (isTouch) {
          return '<div><input id="input" class="faux-input" type="date"/><div>';
        } else {
          return '<div><div  id="input" role="textbox" class="faux-input" contenteditable="true">{{placeholder}}</div></div>';
        }
      },
      compile: function(template) {
        template.prop('type', 'date');
        return {
          pre: function() {
          },
          post: function(scope, elem, attr, ctrl) {
            // -- check if we are using a touch device  --/
            var isDateSupported = function() {
              var i = document.createElement('input');
              i.setAttribute('type', 'date');
              return i.type !== 'text';
            };

            var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
            var isTouch = ('createTouch' in $window.document) && isNative && isDateSupported();
        //variable
        var config = {
          format: '00/00/0000',
          placeholder: 'dd/mm/jjjj'
        };
        var dateformat;
        if(isTouch){
          dateformat = 'yyyy-mm-dd';
          config.placeholder = 'yyyy-MM-dd';
        }else{
          dateformat = 'dd/mm/yyyy';
        }

        var element = elem.find('#input');
        var ngControl = ctrl[1];
        var controller = ctrl[0];
        var form = ctrl[2];

        var prefix = '';
        if(angular.isDefined(attr.validName)){
          setTimeout(function(){
            if(form && attr.name && typeof attr.name === 'string' && attr.name !== ''){
            safeApply(scope,function(){
              prefix = attr.validName;
              form.$removeControl(ngControl);
              ngControl.$name = prefix+attr.name;
              form.$addControl(ngControl);
            });
          }
          }, 1);
        }else{
          setTimeout(function(){
            safeApply(scope,function(){
              if(form){
                form.$addControl(ngControl);
              }
            });
          }, 1);
        }

        function validFormat(date,format){
          var dateObject;
          if(angular.isDefined(date) && date !== null){

            if(typeof date === 'string'){
              if(date.length !== 10){ return false; }

              if(!isTouch && !/^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/.test(date)){return false;}

              dateObject = dateCalculator.getDate(date, format);
            }else if(angular.isDate(date)){
              dateObject = date;
            }else if(typeof date === 'function'){
              return validFormat(date(),format);
            }else {
              return false;
            }

            return dateObject.toString()!=='Invalid Date';
          }
        }

        var isRequired = (function(){
          if(attr.required || attr.require){
            return true;
          }else{
            return false;
          }
        })();
        var noErrorClass = 'hide-error';
        var errorElem = $(elem.find('.faux-input')[0]);

        function checkValidity(value){
          var stringValue;
          if(value != 'Invalid Date' && angular.isDate(value)){
            stringValue = dateCalculator.format(value,dateformat);
          }else{
            stringValue = value;
          }


          safeApply(scope,function(){

            if(angular.isDate(scope.minDate)){
              if(dateCalculator.dateBeforeOther(value,scope.minDate)){
                ngControl.$setValidity('date-min',true);
                errorElem.addClass(noErrorClass);
              }else{
                ngControl.$setValidity('date-min',false);
                errorElem.removeClass(noErrorClass);
              }

            }
            if(angular.isDate(scope.maxDate)){
              if(dateCalculator.dateBeforeOther(scope.maxDate,value)){
                ngControl.$setValidity('date-max',true);
                errorElem.addClass(noErrorClass);
              }else{
                ngControl.$setValidity('date-max',false);
                errorElem.removeClass(noErrorClass);
              }
            }

            if(validFormat(stringValue,dateformat)){
              ngControl.$setValidity('date',true);
              errorElem.addClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('required',true);
                errorElem.addClass(noErrorClass);
              }
            }else if(stringValue !== config.placeholder && stringValue !== null){
              ngControl.$setValidity('date',false);
              ngControl.$setValidity('date-min',true);
              ngControl.$setValidity('date-max',true);
              errorElem.removeClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('required',true);
              }
            }else{
              ngControl.$setValidity('date',true);
              ngControl.$setValidity('date-min',true);
              ngControl.$setValidity('date-max',true);
              errorElem.addClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('required',false);
                errorElem.removeClass(noErrorClass);
              }
            }

          });
        }
        var myWatch = 0;
 //format text going to user (model to view)
        scope.$watch('$parent.'+ attr.ngModel, function(newVal,oldval) {
          if(myWatch === 0){
            if(!isTouch || isTouch && newVal !== ''){
              if(newVal != 'Invalid Date' && angular.isDate(newVal)){
                var date = dateCalculator.format(newVal,dateformat);
                controller.setValue(date,null,isTouch,false);
                checkValidity(newVal);
              }else{
                controller.setValue(null,null,isTouch,false);
              }
            }else{
               controller.setValue('',null,isTouch,false);
            }
            checkValidity(newVal);
          }else{
            myWatch = 0;
          }
        }, true);

        controller.init(element,config,form,ngControl);

          //format text from the user (view to model)
          ngControl.$parsers.unshift(function(value) {

              if(isTouch && value === ''){
                value = element.val();
              }

            if(value === null || value === ''){
              return value;
            }else if(typeof value === 'string'){
              controller.setValue(value,null,isTouch);
              return dateCalculator.getDate(value,dateformat);
            }else{
              return null;
            }
          });
          element.unbind('input').unbind('change');

          element.on('cut',function(){
            safeApply(scope,function(){
              self.setValue(placeholder);
            })
          })

          //on blur update the model.
          element.on('blur', function() {
            safeApply(scope,function(){
              var value;
              if(isTouch){
                value = element.val();
              }else{
                var values = $(element).clone().contents().contents().unwrap()[0];
                if(values){
                  value = values.wholeText;
                }
              }
              if(value === config.placeholder || value === undefined){
                checkValidity(value);
                //ngControl.$setViewValue();
              }else{
                var date = dateCalculator.getDate(value,dateformat);
                if(date === null){
                  checkValidity(value);
                }else{
                  checkValidity(date);
                }
                controller.setValue(value);
                //fires 2 watches !
                //ngControl.$setViewValue(value);
                //ngControl.$setDirty();
                //ngControl.$render();
              }
                        
              if(!validFormat(date,dateformat)){
                myWatch = 1;
               // controller.setValue(date);
              }
            });
          });
      }
    };

  }
};
}]);
})();;