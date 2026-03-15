export const calculator = function (a, b, op) {
  switch (op) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return a / b;
    default: return "不支持";
  }
}