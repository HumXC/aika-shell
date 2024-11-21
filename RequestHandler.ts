const registeredHandlers = new Map<string, (request: string) => any>();

function Handle(request: string, res: (response: any) => void) {
    const [name] = request.split(" ", 1);
    const handler = registeredHandlers.get(name);
    if (!handler) {
        res(`Handler with name ${name} not found`);
        return;
    }
    const result = handler(request);
    res(result === undefined || result === null ? "" : result);
}
function Register(name: string, handler: (request: string) => any) {
    if (registeredHandlers.has(name))
        throw new Error(`Handler with name ${name} already registered`);
    registeredHandlers.set(name, handler);
}
export { Handle, Register };
