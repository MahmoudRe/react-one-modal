export function runOnce(fn: Function) {
    let flag = false;
    return function() {
      if (flag) return;
      flag = true;
      
      // @ts-expect-error
      fn.apply(this, arguments)
    }
  }
  