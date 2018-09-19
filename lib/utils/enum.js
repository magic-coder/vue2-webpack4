// const ORIENTATION = Enum("NORTH", "SOUTH", "WEST", "EAST")
// const ORIEN = Enum("NORTH", "SOUTH", "WEST", "EAST")
class Enum {
    constructor(...args) {
        Array.from(args).forEach((arg) => {
            this[arg] = arg;
        });
    }
}
export default (...args) => {
    return new Enum(...args);
};
