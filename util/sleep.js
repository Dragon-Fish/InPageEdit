module.exports = (delay) => {
  if (isNaN(Number(delay)) || delay < 0) delay = 0
  return new Promise((next) => {
    setTimeout(next, delay)
  })
}
