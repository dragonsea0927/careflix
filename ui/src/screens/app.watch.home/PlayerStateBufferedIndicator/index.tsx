import './style.css'
import * as React from 'react'
import { useEffect } from 'react'
import { useBufferState } from '~/hooks/useBufferState'

interface Props {
  isPlaying: boolean
}

function PlayerStateBufferedIndicator(props: Props) {
  const [isOpen, setIsOpen] = useBufferState({ timeout: 400 })

  useEffect(() => {
    setIsOpen()
  }, [props.isPlaying])

  if (!isOpen) {
    return null
  }

  return (
    <div className="app-watch-player-state-buffered-indicator">
      {props.isPlaying ? <i className="fa fa-play" /> : <i className="fa fa-pause" />}
    </div>
  )
}

export default PlayerStateBufferedIndicator