//FOR USE IN DEVELOPMENT
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * i18nCompiler.js
 *
 * ICU PluralFormat + SelectFormat for JavaScript
 *
 * MessageFormat contribution original by Alex Sexton - @SlexAxton
 * 
 * Copyright 2014
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Tomás Ruiz - @tomasruizr, tomasruizr@gmail.com
 * @version 0.1.0
 * @contributor_license Dojo CLA
 */

(function ( root ) {
  //************************************************
  //Inheritance from Message Format
  //************************************************
  var MessageFormat = require('messageformat');
  function i18nCompiler() {
    MessageFormat.apply(this, Array.prototype.slice.call(arguments));
  };
  i18nCompiler.prototype = new MessageFormat('en');

  //************************************************
  //Functino override
  //************************************************
  i18nCompiler.prototype.functions = function (fewLimit, manyLimit) {
    fewLimit = fewLimit|| 10;
    manyLimit = manyLimit || 20;
    var str = 
'(function(G){\n'
+'  G[\'i18n\']={\n'
+'    lc:function(n){\n'
+'      var str;\n'
+'        if (n===0)\n'
+'          str = \'zero\';\n'
+'        else if (n===1)\n'
+'          str = \'one\';\n'
+'        else if (n===2)\n'
+'          str = \'two\';\n'
+'        else if (n >= 3 && n <'+ fewLimit + ')\n'
+'          str = \'few\';\n'
+'        else if (n >= '+ fewLimit + ' && n < '+ manyLimit + ')\n'
+'          str = \'many\';\n'
+'        else\n'
+'          str = \'other\';\n'
+'        return str;\n'
+'      },\n'
+'    c:function(data, varName){\n'
+'      if(!data) throw new Error("MessageFormat: Data required for \'"+varName+"\'.")\n'
+'    },\n'
+'\n'
+'    n:function(data, varName, offset){\n'
+'      if(isNaN(data[varName]))throw new Error("MessageFormat: \'"+varName+"\' isn\'t a number.");\n'
+'      return data[varName] - (offset||0)\n'
+'    }, \n'
+'    v:function(data, varName){\n'
+'      this.c(data, varName);\n'
+'      return data[varName]\n'
+'    }, \n'
+'    p:function(data, varName, offset, plurals){\n'
+'      i18n.c(data, varName);\n'
+'      var str = data[varName] in plurals ? plurals[data[varName]] : (varName=i18n.lc(data[varName]-offset), varName in plurals?plurals[varName]:plurals.other);\n'
+'      return str\n'
+'    }, \n'
+'    s:function(data, varName, plurals){\n'
+'      i18n.c(data,varName);\n'
+'      return data[varName] in plurals ? plurals[data[varName]] : plurals.other\n'
+'    \n'
+'    }\n'
+'  }\n'
+'\n'
+'}\n'
+')(this);';
    
    return str;
  };

  i18nCompiler.prototype.compile = function ( message ) {
    return (new Function(
      this.functions() +
      'return ' + this.precompile( this.parse( message ))
    ))();
  };
  
  i18nCompiler.prototype.precompile = function(ast, datos) {
    var self = this,
        needOther = false;

    function _next ( data ) {
      var res = JSON.parse( JSON.stringify( data ) );
      res.pf_count++;
      return res;
    }
    function interpMFP ( ast, data ) {
      // Set some default data
      data = data || { keys: {}, offset: {} };
      var r = [], i, tmp;

      switch ( ast.type ) {
        case 'program':
          return interpMFP( ast.program );
        case 'messageFormatPattern':
          for ( i = 0; i < ast.statements.length; ++i ) {
            r.push(interpMFP( ast.statements[i], data ));
          }
          tmp = r.join('+') || '""';
          return data.pf_count ? tmp : 'function(d){return ' + tmp + '}';
        case 'messageFormatPatternRight':
          for ( i = 0; i < ast.statements.length; ++i ) {
            r.push(interpMFP( ast.statements[i], data ));
          }
          return r.join('+');
        case 'messageFormatElement':
          data.pf_count = data.pf_count || 0;
          if ( ast.output ) {
            return self.globalName + '.v(d,"' + ast.argumentIndex + '")';
          }
          else {
            data.keys[data.pf_count] = '"' + ast.argumentIndex + '"';
            return interpMFP( ast.elementFormat, data );
          }
          return '';
        case 'elementFormat':
          if ( ast.key === 'select' ) {
            return self.globalName + '.s(d,' + data.keys[data.pf_count] + ',' + interpMFP( ast.val, data ) + ')';
          }
          else if ( ast.key === 'plural' ) {
            data.offset[data.pf_count || 0] = ast.val.offset || 0;
            //****************************
            //Modified by Tomás Ruiz <tomsaruizr@gmail.com> in order to avoid sending the current language to the client
            //since it is loaded directly from the server and is the only language in the client side by the tieme of execution.
            //Original:
            // return self.globalName + '.p(d,' + data.keys[data.pf_count] + ',' + (data.offset[data.pf_count] || 0)
            //   + ',"' + self.lc + '",' + interpMFP( ast.val, data ) + ')';
            //****************************
            return self.globalName + '.p(d,' + data.keys[data.pf_count] + ',' + (data.offset[data.pf_count] || 0)
              + ',' + interpMFP( ast.val, data ) + ')';
          }
          return '';
        /* // Unreachable cases.
        case 'pluralStyle':
        case 'selectStyle':*/
        case 'pluralFormatPattern':
          data.pf_count = data.pf_count || 0;
          needOther = true;
          // We're going to simultaneously check to make sure we hit the required 'other' option.

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in pluralFormatPattern " + data.pf_count);
          }
          return '{' + r.join(',') + '}';
        case 'selectFormatPattern':

          data.pf_count = data.pf_count || 0;
          data.offset[data.pf_count] = 0;
          needOther = true;

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in selectFormatPattern " + data.pf_count);
          }
          return '{' + r.join(',') + '}';
        /* // Unreachable
        case 'pluralForms':
        */
        case 'string':
          tmp = '"' + (ast.val || "").replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
          if ( data.pf_count ) {
            var o = data.offset[data.pf_count-1];
            tmp = tmp.replace(/(^|[^\\])#/g, '$1"+' + self.globalName + '.n(d,' + data.keys[data.pf_count-1] + (o ? ',' + o : '') + ')+"');
            tmp = tmp.replace(/^""\+/, '').replace(/\+""$/, '');
          }
          return tmp;
        default:
          throw new Error( 'Bad AST type: ' + ast.type );
      }
    }
    return interpMFP( ast );
  };

  //************************************************
  //Module export and preparation for use in server or client side, although this process is going to be
  //only on server, it is possible for someone else to give it a good use in the client side,
  //so lefted here anyway.
  //************************************************
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = i18nCompiler;
    }
    exports.i18nCompiler = i18nCompiler;
  }
  else if (typeof define === 'function' && define.amd) {
    define(function() {
      return i18nCompiler;
    });
  }
  else {
    root['i18nCompiler'] = i18nCompiler;
  }

})( this );

},{"messageformat":3}],2:[function(require,module,exports){
var i18nCompiler = require('./CompilerMessageFormat.js');
(function(G){
	__ = function (string, data, quote){
		quote = quote | false;
        var compiler = new i18nCompiler('en');
        //if there is no data to translate.
        var result = '';
        if (!data){
            result = string;
        }
        else{
            result = compiler.compile(string)(data);
        }

        return result;
	}

})(this)
},{"./CompilerMessageFormat.js":1}],3:[function(require,module,exports){
(function (__dirname){
/**
 * messageformat.js
 *
 * ICU PluralFormat + SelectFormat for JavaScript
 * 
 * Copyright 2014
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Alex Sexton - @SlexAxton
 * @version 0.1.7
 * @contributor_license Dojo CLA
 */

(function ( root ) {

  function MessageFormat ( locale, pluralFunc, globalName ) {
    var lc = locale || 'en', lcFile;
    if ( pluralFunc ) {
      MessageFormat.locale[lc] = pluralFunc;
    } else {
      while ( lc && ! MessageFormat.locale.hasOwnProperty( lc ) ) {
        lc = lc.replace(/[-_]?[^-_]*$/, '');
      }
      if ( ! lc ) {
        lc = locale.replace(/[-_].*$/, '');
        MessageFormat.loadLocale(lc);
      }
    }
    this.lc = lc;  // used in 'elementFormat'
    this.globalName = globalName || 'i18n';
  }

  if ( !('locale' in MessageFormat) ) MessageFormat.locale = {};

  MessageFormat.loadLocale = function ( lc ) {
    try {
      var lcFile = require('path').join(__dirname, 'locale', lc + '.js'),
          lcStr = ('' + require('fs').readFileSync(lcFile)).match(/{[^]*}/);
      if (!lcStr) throw "no function found in file '" + lcFile + "'";
      MessageFormat.locale[lc] = 'function(n)' + lcStr;
    } catch (ex) {
      if ( lc == 'en' ) {
        MessageFormat.locale[lc] = 'function(n){return n===1?"one":"other"}';
      } else {
        ex.message = 'Locale ' + lc + ' could not be loaded: ' + ex.message;
        throw ex;
      }
    }
  };

  MessageFormat.prototype.functions = function () {
    var l = [];
    for ( var lc in MessageFormat.locale ) {
      if ( MessageFormat.locale.hasOwnProperty(lc) ) {
        l.push(JSON.stringify(lc) + ':' + MessageFormat.locale[lc].toString().trim());
      }
    }
    return '{lc:{' + l.join(',') + '},\n'
      + 'c:function(d,k){if(!d)throw new Error("MessageFormat: Data required for \'"+k+"\'.")},\n'
      + 'n:function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: \'"+k+"\' isn\'t a number.");return d[k]-(o||0)},\n'
      + 'v:function(d,k){' + this.globalName + '.c(d,k);return d[k]},\n'
      + 'p:function(d,k,o,l,p){' + this.globalName + '.c(d,k);return d[k] in p?p[d[k]]:(k=' + this.globalName + '.lc[l](d[k]-o),k in p?p[k]:p.other)},\n'
      + 's:function(d,k,p){' + this.globalName + '.c(d,k);return d[k] in p?p[d[k]]:p.other}}';
  };

  // This is generated and pulled in for browsers.
  var mparser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */
  
    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }
  
    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;
  
      this.name     = "SyntaxError";
    }
  
    peg$subclass(SyntaxError, Error);
  
    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},
  
          peg$FAILED = {},
  
          peg$startRuleFunctions = { start: peg$parsestart },
          peg$startRuleFunction  = peg$parsestart,
  
          peg$c0 = function(messageFormatPattern) { return { type: "program", program: messageFormatPattern }; },
          peg$c1 = peg$FAILED,
          peg$c2 = [],
          peg$c3 = function(s1, inner) {
              var st = [];
              if ( s1 && s1.val ) {
                st.push( s1 );
              }
              for( var i in inner ){
                if ( inner.hasOwnProperty( i ) ) {
                  st.push( inner[ i ] );
                }
              }
              return { type: 'messageFormatPattern', statements: st };
            },
          peg$c4 = "{",
          peg$c5 = { type: "literal", value: "{", description: "\"{\"" },
          peg$c6 = "}",
          peg$c7 = { type: "literal", value: "}", description: "\"}\"" },
          peg$c8 = function(mfe, s1) {
              var res = [];
              if ( mfe ) {
                res.push(mfe);
              }
              if ( s1 && s1.val ) {
                res.push( s1 );
              }
              return { type: "messageFormatPatternRight", statements : res };
            },
          peg$c9 = null,
          peg$c10 = ",",
          peg$c11 = { type: "literal", value: ",", description: "\",\"" },
          peg$c12 = function(argIdx, efmt) {
              var res = { 
                type: "messageFormatElement",
                argumentIndex: argIdx
              };
              if ( efmt && efmt.length ) {
                res.elementFormat = efmt[1];
              }
              else {
                res.output = true;
              }
              return res;
            },
          peg$c13 = "plural",
          peg$c14 = { type: "literal", value: "plural", description: "\"plural\"" },
          peg$c15 = function(t, s) {
              return {
                type : "elementFormat",
                key  : t,
                val  : s.val
              };
            },
          peg$c16 = "select",
          peg$c17 = { type: "literal", value: "select", description: "\"select\"" },
          peg$c18 = function(pfp) {
              return { type: "pluralStyle", val: pfp };
            },
          peg$c19 = function(sfp) {
              return { type: "selectStyle", val: sfp };
            },
          peg$c20 = function(op, pf) {
              var res = {
                type: "pluralFormatPattern",
                pluralForms: pf
              };
              if ( op ) {
                res.offset = op;
              }
              else {
                res.offset = 0;
              }
              return res;
            },
          peg$c21 = "offset",
          peg$c22 = { type: "literal", value: "offset", description: "\"offset\"" },
          peg$c23 = ":",
          peg$c24 = { type: "literal", value: ":", description: "\":\"" },
          peg$c25 = function(d) {
              return d;
            },
          peg$c26 = function(pf) {
              return {
                type: "selectFormatPattern",
                pluralForms: pf
              };
            },
          peg$c27 = function(k, mfp) {
              return {
                type: "pluralForms",
                key: k,
                val: mfp
              };
            },
          peg$c28 = function(i) {
              return i;
            },
          peg$c29 = "=",
          peg$c30 = { type: "literal", value: "=", description: "\"=\"" },
          peg$c31 = function(ws, s) {
              var tmp = [];
              for( var i = 0; i < s.length; ++i ) {
                for( var j = 0; j < s[ i ].length; ++j ) {
                  tmp.push(s[i][j]);
                }
              }
              return {
                type: "string",
                val: ws + tmp.join('')
              };
            },
          peg$c32 = /^[0-9a-zA-Z$_]/,
          peg$c33 = { type: "class", value: "[0-9a-zA-Z$_]", description: "[0-9a-zA-Z$_]" },
          peg$c34 = /^[^ \t\n\r,.+={}]/,
          peg$c35 = { type: "class", value: "[^ \\t\\n\\r,.+={}]", description: "[^ \\t\\n\\r,.+={}]" },
          peg$c36 = function(s1, s2) {
              return s1 + (s2 ? s2.join('') : '');
            },
          peg$c37 = function(chars) { return chars.join(''); },
          peg$c38 = /^[^{}\\\0-\x1F \t\n\r]/,
          peg$c39 = { type: "class", value: "[^{}\\\\\\0-\\x1F \\t\\n\\r]", description: "[^{}\\\\\\0-\\x1F \\t\\n\\r]" },
          peg$c40 = function(x) {
              return x;
            },
          peg$c41 = "\\#",
          peg$c42 = { type: "literal", value: "\\#", description: "\"\\\\#\"" },
          peg$c43 = function() {
              return "\\#";
            },
          peg$c44 = "\\{",
          peg$c45 = { type: "literal", value: "\\{", description: "\"\\\\{\"" },
          peg$c46 = function() {
              return "\u007B";
            },
          peg$c47 = "\\}",
          peg$c48 = { type: "literal", value: "\\}", description: "\"\\\\}\"" },
          peg$c49 = function() {
              return "\u007D";
            },
          peg$c50 = "\\u",
          peg$c51 = { type: "literal", value: "\\u", description: "\"\\\\u\"" },
          peg$c52 = function(h1, h2, h3, h4) {
                return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
            },
          peg$c53 = /^[0-9]/,
          peg$c54 = { type: "class", value: "[0-9]", description: "[0-9]" },
          peg$c55 = function(ds) {
              return parseInt((ds.join('')), 10);
            },
          peg$c56 = /^[0-9a-fA-F]/,
          peg$c57 = { type: "class", value: "[0-9a-fA-F]", description: "[0-9a-fA-F]" },
          peg$c58 = { type: "other", description: "whitespace" },
          peg$c59 = function(w) { return w.join(''); },
          peg$c60 = /^[ \t\n\r]/,
          peg$c61 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
  
          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,
  
          peg$result;
  
      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }
  
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }
  
      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }
  
      function offset() {
        return peg$reportedPos;
      }
  
      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }
  
      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }
  
      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }
  
      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }
  
      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;
  
          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }
  
        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }
  
        return peg$cachedPosDetails;
      }
  
      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }
  
        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }
  
        peg$maxFailExpected.push(expected);
      }
  
      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;
  
          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });
  
          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }
  
        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }
  
            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }
  
          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;
  
          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }
  
          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];
  
          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";
  
          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }
  
        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;
  
        if (expected !== null) {
          cleanupExpected(expected);
        }
  
        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }
  
      function peg$parsestart() {
        var s0, s1;
  
        s0 = peg$currPos;
        s1 = peg$parsemessageFormatPattern();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c0(s1);
        }
        s0 = s1;
  
        return s0;
      }
  
      function peg$parsemessageFormatPattern() {
        var s0, s1, s2, s3;
  
        s0 = peg$currPos;
        s1 = peg$parsestring();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsemessageFormatPatternRight();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsemessageFormatPatternRight();
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c3(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parsemessageFormatPatternRight() {
        var s0, s1, s2, s3, s4, s5, s6;
  
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c4;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c5); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsemessageFormatElement();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 125) {
                  s5 = peg$c6;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
                if (s5 !== peg$FAILED) {
                  s6 = peg$parsestring();
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c8(s3, s6);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c1;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c1;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c1;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parsemessageFormatElement() {
        var s0, s1, s2, s3, s4;
  
        s0 = peg$currPos;
        s1 = peg$parseid();
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c10;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c11); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseelementFormat();
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c1;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c1;
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c9;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c12(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parseelementFormat() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
  
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c13) {
            s2 = peg$c13;
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c14); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s4 = peg$c10;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c11); }
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parsepluralStyle();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c15(s2, s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c1;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c1;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c1;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c1;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_();
          if (s1 !== peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c16) {
              s2 = peg$c16;
              peg$currPos += 6;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c17); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parse_();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 44) {
                  s4 = peg$c10;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c11); }
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parseselectStyle();
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parse_();
                      if (s7 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c15(s2, s6);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c1;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c1;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c1;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c1;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c1;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        }
  
        return s0;
      }
  
      function peg$parsepluralStyle() {
        var s0, s1;
  
        s0 = peg$currPos;
        s1 = peg$parsepluralFormatPattern();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c18(s1);
        }
        s0 = s1;
  
        return s0;
      }
  
      function peg$parseselectStyle() {
        var s0, s1;
  
        s0 = peg$currPos;
        s1 = peg$parseselectFormatPattern();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c19(s1);
        }
        s0 = s1;
  
        return s0;
      }
  
      function peg$parsepluralFormatPattern() {
        var s0, s1, s2, s3;
  
        s0 = peg$currPos;
        s1 = peg$parseoffsetPattern();
        if (s1 === peg$FAILED) {
          s1 = peg$c9;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsepluralForms();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsepluralForms();
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c20(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parseoffsetPattern() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
  
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c21) {
            s2 = peg$c21;
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c22); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 58) {
                s4 = peg$c23;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c24); }
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parsedigits();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c25(s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c1;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c1;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c1;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c1;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parseselectFormatPattern() {
        var s0, s1, s2;
  
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsepluralForms();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsepluralForms();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c26(s1);
        }
        s0 = s1;
  
        return s0;
      }
  
      function peg$parsepluralForms() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;
  
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsestringKey();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 123) {
                s4 = peg$c4;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c5); }
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parsemessageFormatPattern();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 125) {
                        s8 = peg$c6;
                        peg$currPos++;
                      } else {
                        s8 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c7); }
                      }
                      if (s8 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c27(s2, s6);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c1;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c1;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c1;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c1;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c1;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parsestringKey() {
        var s0, s1, s2;
  
        s0 = peg$currPos;
        s1 = peg$parseid();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 61) {
            s1 = peg$c29;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c30); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parsedigits();
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c25(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        }
  
        return s0;
      }
  
      function peg$parsestring() {
        var s0, s1, s2, s3, s4, s5, s6;
  
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsechars();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                s4 = [s4, s5, s6];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c1;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c1;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c1;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsechars();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 !== peg$FAILED) {
                  s4 = [s4, s5, s6];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c1;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c1;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c1;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parseid() {
        var s0, s1, s2, s3, s4;
  
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          if (peg$c32.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c33); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$c34.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c35); }
            }
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c34.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c35); }
              }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c36(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c1;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c1;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c1;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c1;
        }
  
        return s0;
      }
  
      function peg$parsechars() {
        var s0, s1, s2;
  
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsechar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsechar();
          }
        } else {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c37(s1);
        }
        s0 = s1;
  
        return s0;
      }
  
      function peg$parsechar() {
        var s0, s1, s2, s3, s4, s5;
  
        s0 = peg$currPos;
        if (peg$c38.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c39); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c40(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c41) {
            s1 = peg$c41;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c42); }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c43();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c44) {
              s1 = peg$c44;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c45); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c46();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 2) === peg$c47) {
                s1 = peg$c47;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c48); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c49();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c50) {
                  s1 = peg$c50;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
                }
                if (s1 !== peg$FAILED) {
                  s2 = peg$parsehexDigit();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parsehexDigit();
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parsehexDigit();
                      if (s4 !== peg$FAILED) {
                        s5 = peg$parsehexDigit();
                        if (s5 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c52(s2, s3, s4, s5);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c1;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c1;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c1;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c1;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c1;
                }
              }
            }
          }
        }
  
        return s0;
      }
  
      function peg$parsedigits() {
        var s0, s1, s2;
  
        s0 = peg$currPos;
        s1 = [];
        if (peg$c53.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c53.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c54); }
            }
          }
        } else {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c55(s1);
        }
        s0 = s1;
  
        return s0;
      }
  
      function peg$parsehexDigit() {
        var s0;
  
        if (peg$c56.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c57); }
        }
  
        return s0;
      }
  
      function peg$parse_() {
        var s0, s1, s2;
  
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsewhitespace();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsewhitespace();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c59(s1);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
  
        return s0;
      }
  
      function peg$parsewhitespace() {
        var s0;
  
        if (peg$c60.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c61); }
        }
  
        return s0;
      }
  
      peg$result = peg$startRuleFunction();
  
      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }
  
        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }
  
    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();

  MessageFormat.prototype.parse = function () {
    // Bind to itself so error handling works
    return mparser.parse.apply( mparser, arguments );
  };

  MessageFormat.prototype.precompile = function ( ast ) {
    var self = this,
        needOther = false;

    function _next ( data ) {
      var res = JSON.parse( JSON.stringify( data ) );
      res.pf_count++;
      return res;
    }
    function interpMFP ( ast, data ) {
      // Set some default data
      data = data || { keys: {}, offset: {} };
      var r = [], i, tmp;

      switch ( ast.type ) {
        case 'program':
          return interpMFP( ast.program );
        case 'messageFormatPattern':
          for ( i = 0; i < ast.statements.length; ++i ) {
            r.push(interpMFP( ast.statements[i], data ));
          }
          tmp = r.join('+') || '""';
          return data.pf_count ? tmp : 'function(d){return ' + tmp + '}';
        case 'messageFormatPatternRight':
          for ( i = 0; i < ast.statements.length; ++i ) {
            r.push(interpMFP( ast.statements[i], data ));
          }
          return r.join('+');
        case 'messageFormatElement':
          data.pf_count = data.pf_count || 0;
          if ( ast.output ) {
            return self.globalName + '.v(d,"' + ast.argumentIndex + '")';
          }
          else {
            data.keys[data.pf_count] = '"' + ast.argumentIndex + '"';
            return interpMFP( ast.elementFormat, data );
          }
          return '';
        case 'elementFormat':
          if ( ast.key === 'select' ) {
            return self.globalName + '.s(d,' + data.keys[data.pf_count] + ',' + interpMFP( ast.val, data ) + ')';
          }
          else if ( ast.key === 'plural' ) {
            data.offset[data.pf_count || 0] = ast.val.offset || 0;
            
            //****************************
            //Modified by Tomás Ruiz <tomsaruizr@gmail.com> in order to avoid sending the current language to the client
            //since it is loaded directly from the server and is the only language in the client side by the tieme of execution.
            //Original:
            // return self.globalName + '.p(d,' + data.keys[data.pf_count] + ',' + (data.offset[data.pf_count] || 0)
            //   + ',"' + self.lc + '",' + interpMFP( ast.val, data ) + ')';
            //****************************
            return self.globalName + '.p(d,' + data.keys[data.pf_count] + ',' + (data.offset[data.pf_count] || 0)
              + ',"' + interpMFP( ast.val, data ) + ')';
          }
          return '';
        /* // Unreachable cases.
        case 'pluralStyle':
        case 'selectStyle':*/
        case 'pluralFormatPattern':
          data.pf_count = data.pf_count || 0;
          needOther = true;
          // We're going to simultaneously check to make sure we hit the required 'other' option.

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in pluralFormatPattern " + data.pf_count);
          }
          return '{' + r.join(',') + '}';
        case 'selectFormatPattern':

          data.pf_count = data.pf_count || 0;
          data.offset[data.pf_count] = 0;
          needOther = true;

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in selectFormatPattern " + data.pf_count);
          }
          return '{' + r.join(',') + '}';
        /* // Unreachable
        case 'pluralForms':
        */
        case 'string':
          tmp = '"' + (ast.val || "").replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
          if ( data.pf_count ) {
            var o = data.offset[data.pf_count-1];
            tmp = tmp.replace(/(^|[^\\])#/g, '$1"+' + self.globalName + '.n(d,' + data.keys[data.pf_count-1] + (o ? ',' + o : '') + ')+"');
            tmp = tmp.replace(/^""\+/, '').replace(/\+""$/, '');
          }
          return tmp;
        default:
          throw new Error( 'Bad AST type: ' + ast.type );
      }
    }
    return interpMFP( ast );
  };

  MessageFormat.prototype.compile = function ( message ) {
    return (new Function(
      'this[\'' + this.globalName + '\']=' + this.functions() + ';' +
      'return ' + this.precompile( this.parse( message ))
    ))();
  };

  MessageFormat.prototype.precompileObject = function ( messages ) {
    var tmp = [];
    for (var key in messages) {
      tmp.push(JSON.stringify(key) + ':' + this.precompile(this.parse(messages[key])));
    }
    return '{\n' + tmp.join(',\n') + '}';
  };


  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = MessageFormat;
    }
    exports.MessageFormat = MessageFormat;
  }
  else if (typeof define === 'function' && define.amd) {
    define(function() {
      return MessageFormat;
    });
  }
  else {
    root['MessageFormat'] = MessageFormat;
  }

})( this );

}).call(this,"/node_modules/messageformat")
},{"fs":4,"path":5}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":6}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[2]);
