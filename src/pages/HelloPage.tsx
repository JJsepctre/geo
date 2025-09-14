import React from 'react'
import ListItem from '../components/ListItem'

function HelloPage() {
  const list = ['Item aa', 'Item bb', 'Item cc'];

  return (
    <div>
      <h1>Hello Page</h1>
      {list.map((item, index) => (
        <ListItem key={index} title={item} />
      ))}
    </div>
  )
}

export default HelloPage