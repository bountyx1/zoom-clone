export const messageFormat = (message) => {
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    return {message, time}
}