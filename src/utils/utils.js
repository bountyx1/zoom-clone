export const messageFormat = (message, user) => {
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return {message, time, user};
}

