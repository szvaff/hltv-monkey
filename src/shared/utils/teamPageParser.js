import $ from 'jquery'

export default function teamPageParser (page) {
  let doc = $('<div></div>')
  doc.html(page)

  const teamName = doc.find("div.profile-team-name").text()
  let rank = doc.find("div.profile-team-stats-container div.profile-team-stat:nth-of-type(1) span").text()
  if (rank === "-") rank = null
  else rank = parseInt(rank.replace('#', ''))

  return { teamName, rank }
}