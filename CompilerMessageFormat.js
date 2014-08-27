/**
 * CompilerMessageFormat.js
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
 */

(function ( root ) {
  //************************************************
  //Inheritance from Message Format
  //************************************************
  var MessageFormat = require('messageformat');
  function CompilerMessageFormat() {
    MessageFormat.apply(this, Array.prototype.slice.call(arguments));
  };
  CompilerMessageFormat.prototype = new MessageFormat('en');

  //************************************************
  //Functino override
  //************************************************
  CompilerMessageFormat.prototype.functions = function (fewLimit, manyLimit) {
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

  CompilerMessageFormat.prototype.compile = function ( message ) {
    return (new Function(
      this.functions() +
      'return ' + this.precompile( this.parse( message ))
    ))();
  };
  
  CompilerMessageFormat.prototype.precompile = function(ast, datos) {
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
      exports = module.exports = CompilerMessageFormat;
    }
    exports.CompilerMessageFormat = CompilerMessageFormat;
  }
  else if (typeof define === 'function' && define.amd) {
    define(function() {
      return CompilerMessageFormat;
    });
  }
  else {
    root['CompilerMessageFormat'] = CompilerMessageFormat;
  }

})( this );
