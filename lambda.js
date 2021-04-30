// Basic data structure, essentially a LISP/Scheme-like cons
// pre-terminal nodes are expected to be of the form new cons(null, "string")
function cons(car, cdr) {
  this.car = car;
  this.cdr = cdr;
}

// takes a stack of symbols, returns a pair: a tree and the remaining symbols
function fold(split) {
  if (split == null) return (new cons (null, null));
  if (split.length == 0) return (new cons (null, null));
  var token = split.shift();
  if (token == ")") return (new cons (null, split));
  var next = fold(split);
  if (token == "(") {
    var nextnext = fold(next.cdr);
    return (new cons ((new cons (next.car, nextnext.car)),
                      nextnext.cdr));
  }
  return (new cons ((new cons ((new cons (null, token)),
                               next.car)),
                    next.cdr))
}

// substitute arg in for v in tree
function sub(tree, v, arg) {
  if (tree == null) return (null);
  if (tree.car == null) if (tree.cdr == v) return (arg);
  if (tree.car == null) return (tree);

  // perform alpha reduction to prevent variable collision
  if (isBindingForm(tree)) 
    return (new cons (tree.car, 
                      sub(sub(tree.cdr,         // inner sub = alpha reduc.
                              tree.cdr.car.cdr, 
                              fresh(tree.cdr.car.cdr)),
                          v,
                          arg)));

  return (new cons ((sub (tree.car, v, arg)),
                    (sub (tree.cdr, v, arg))))
}

// Guaranteed unique for each call as long as string is not empty.
var i = 0;
function fresh(string) {
  i = i+1;
  if (typeof(string) != "string") return (string);
  return (new cons (null,  
                    string.substring(0,1) + (i).toString()));
}

// Keep reducing until there is no more change
function fixedPoint (tree) {
  var t2 = reduce(tree);
  if (treeToString(tree) == treeToString(t2)) return (tree);
  return (fixedPoint (t2));
}

// Reduce all the arguments, then try to do beta conversion on the whole
function reduce(tree) {
  if (tree == null) return (tree);
  if (typeof(tree) == "string") return (tree);
  return (convert (new cons (reduce (tree.car), mapReduce (tree.cdr))));
}

// Reduce all the arguments in a list
function mapReduce(tree) {
  if (tree == null) return (tree);
  if (tree.car == null) return (tree);
  return (new cons (reduce (tree.car), mapReduce(tree.cdr )));
}

// If the list is of the form ((lambda var body) arg), do beta reduc.
function convert(tree) {
  if (!(isConvertable(tree))) return (tree);
  return (sub(tree.car.cdr.cdr.car, tree.car.cdr.car.cdr, tree.cdr.car))
} 

// Is of form ((lambda var body) arg)?
function isConvertable(tree) {
  if (tree == null) return (false);
  if (!(isBindingForm(tree.car))) return (false);
  if (tree.car.car.cdr != "lambda") return (false);
  if (tree.cdr == null) return (false);
  if (tree.cdr.car == null) return (false);
  return(true);
}  

// Is of form (lambda var body)?
function isBindingForm(tree) {
  if (tree == null) return (false);
  if (tree.car == null) return (false);
  if (tree.car.car != null) return (false);
  if ((tree.car.cdr != "lambda") 
      && (tree.car.cdr != "exists")
      && (tree.car.cdr != "forall")
      && (tree.car.cdr != "\u03BB")
      && (tree.car.cdr != "\u2200")
      && (tree.car.cdr != "\u2203")
     )
    return (false);
  if (tree.car.cdr == null) return (false);
  if (tree.cdr.car == null) return (false);
  if (tree.cdr.car.car != null) return (false);
  if (tree.cdr.cdr == null) return (false);
  return (true);
}

function treeToString(tree) {
  if (tree == null) return ("")
  if (tree.car == null) return (tree.cdr)
  if ((tree.car).car == null) 
    return (treeToString(tree.car) + " " + treeToString(tree.cdr))
  return ("(" + treeToString(tree.car) + ")" + treeToString(tree.cdr))
}

// use this instead of treeToString if you want to see the full structure
function treeToStringRaw(tree) {
  if (tree == null) return ("@")
  if (typeof(tree) == "string") return (tree);
  return ("(" + treeToStringRaw(tree.car) + "." + 
                treeToStringRaw(tree.cdr) + ")")
}

// Make sure each paren will count as a separate token
function stringToTree(input) {
  input = input.replace(/\(/g, " ( ");
  input = input.replace(/\)/g, " ) ");
  input = input.replace(/\^/g, " ^ ");
  input = input.replace(/\u03BB/g, "lambda");
  return ((fold(input.split(/[ \f\n\r\t\v]+/))).car)
}

// Adjust spaces to print pretty
function formatTree(tree) {
  output = treeToString (tree);
  output = output.replace(/^[ \f\n\r\t\v]+/, "");
  output = output.replace(/[ \f\n\r\t\v]+$/, "");
  output = output.replace(/[ \f\n\r\t\v]+\)/g, ")");
  output = output.replace(/\)([^)(])/g, ") $1");
//  output = output.replace(/lambda/g, "\u03BB");
//  output = output.replace(/exists/g, "\u2203");
//  output = output.replace(/forall/g, "\u2200");
  return (output)
}

function mytry(form) { 
  i = 0;
  form.result.value = formatTree(fixedPoint(stringToTree(form.input.value)));
}
