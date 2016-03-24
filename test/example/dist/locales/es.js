(function(G){G.locales = G.locales || {};G["lang_es"]={};G["lang_es"].dictionary=[function (d){return "Your "+i18n.v(d,"NUM")+" "+i18n.p(d,"NUM",0,{"one":"message","other":"messages"})+" go here."},"this is going to be the translated string:","este es un subdirectorio tomas",function (d){return "este es un subdirectorio tomas "+i18n.v(d,"NUM")},"Esta es una frase traducida 5","Esta es una frase traducida 4","Esta es una frase traducida 3","Esta es una frase traducida 2","Esta es una frase traducida 6"];G["lang_es"].i18n={    lc:function(n){
      var str;
      if (n===0)
        str = 'zero';
      else if (n===1)
        str = 'one';
      else if (n===2)
        str = 'two';
      else if (n >= 3 && n <10)
        str = 'few';
      else if (n >= 10 && n < 20)
        str = 'many';
      else
        str = 'other';
      return str;
    },
    c:function(data, varName){
      if(!data) throw new Error("MessageFormat: Data required for '"+varName+"'.")
    },
    n:function(data, varName, offset){
      if(isNaN(data[varName]))throw new Error("MessageFormat: '"+varName+"' isn't a number.");
      return data[varName] - (offset||0)
    }, 
    v:function(data, varName){
      this.c(data, varName);
      return data[varName]
    }, 
    p:function(data, varName, offset, plurals){
      i18n.c(data, varName);
      var str = data[varName] in plurals ? plurals[data[varName]] : (varName=i18n.lc(data[varName]-offset), varName in plurals?plurals[varName]:plurals.other);
      return str
    }, 
    s:function(data, varName, plurals){
      i18n.c(data,varName);
      return data[varName] in plurals ? plurals[data[varName]] : plurals.other
    
    }
  }
}
)(this);