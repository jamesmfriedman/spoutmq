/**
 * Take a specific routing key and turn it into all of the possibilities
 */
export const matchRoutingKey = ({
  actual,
  expected
}: {
  actual: string;
  expected: string;
}) => {
  if (actual === expected) return true;
  var regexString =
    '^' + expected.replace(/\*/g, '([^.]+)').replace(/#/g, '([^.]+.?)+') + '$';
  return actual.search(regexString) !== -1;
};
