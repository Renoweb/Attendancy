export const formatMinutes = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h}h ${m.toString().padStart(2, '0')}m`
}
