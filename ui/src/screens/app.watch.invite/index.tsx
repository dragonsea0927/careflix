import './style'

import * as React from 'react'
import UiButton from '~/components/UiButton'
import UiAvatar from '~/components/UiAvatar'

import immer from 'immer'
import { useReducer, useMemo } from 'react'
import { usePartyContext } from '~/screens/app.watch/Context'
import useDebounce from 'react-use/lib/useDebounce'
import axios from '~/lib/axios'
import toSearchObject from '~/utils/toSearchObject'
import toSearchIndexObject from '~/utils/toSearchIndexObject'

interface State {
  data: any[]
  isLoading: boolean
  isSendingInvitation: {
    [key: number]: boolean
  }
  isCancellingInvitation: {
    [key: number]: boolean
  }
  input: string
}

type Action =
  | ReducerAction<'request:init'>
  | ReducerAction<'request:success', { data: any[] }>
  | ReducerAction<'request:error'>
  | ReducerAction<'input', { input: string }>
  | ReducerAction<'invitation.send:init', { id: number }>
  | ReducerAction<'invitation.send:error', { id: number }>
  | ReducerAction<'invitation.send:success', { id: number }>
  | ReducerAction<'invitation.cancel:init', { id: number }>
  | ReducerAction<'invitation.cancel:error', { id: number }>
  | ReducerAction<'invitation.cancel:success', { id: number }>

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'request:init': {
      return {
        ...state,
        isLoading: true
      }
    }

    case 'request:success': {
      return {
        ...state,
        data: action.payload.data,
        isLoading: false
      }
    }

    case 'request:error': {
      return {
        ...state,
        isLoading: false
      }
    }

    case 'input': {
      return {
        ...state,
        input: action.payload.input,
        // We'll empty the current list if the input gets cleared
        data: action.payload.input ? [] : state.data
      }
    }

    case 'invitation.send:init': {
      return {
        ...state,
        isSendingInvitation: immer(state.isSendingInvitation, draft => {
          draft[action.payload.id] = true
        })
      }
    }

    case 'invitation.send:success': {
      return {
        ...state,
        isSendingInvitation: immer(state.isSendingInvitation, draft => {
          delete draft[action.payload.id]
        })
      }
    }

    case 'invitation.send:error': {
      return {
        ...state,
        isSendingInvitation: immer(state.isSendingInvitation, draft => {
          delete draft[action.payload.id]
        })
      }
    }

    case 'invitation.cancel:init': {
      return {
        ...state,
        isCancellingInvitation: immer(state.isCancellingInvitation, draft => {
          draft[action.payload.id] = true
        })
      }
    }

    case 'invitation.cancel:success': {
      return {
        ...state,
        isCancellingInvitation: immer(state.isCancellingInvitation, draft => {
          delete draft[action.payload.id]
        })
      }
    }

    case 'invitation.cancel:error': {
      return {
        ...state,
        isCancellingInvitation: immer(state.isCancellingInvitation, draft => {
          delete draft[action.payload.id]
        })
      }
    }
  }

  throw new Error(`app.watch.invite: ${action.type} is an invalid action type.`)
}

/**
 * Use this to create a route instead of typing everything down
 */
function AppWatchInvite(props: ReactComponentWrapper) {
  const context = usePartyContext()

  const [state, dispatch] = useReducer(reducer, {
    data: [],
    isLoading: false,
    isSendingInvitation: {},
    isCancellingInvitation: {},
    input: ''
  })

  useDebounce(
    async () => {
      // We don't want a search to happen on mount or when the state input is left blank.
      if (!state.input) {
        return
      }

      dispatch({
        type: 'request:init'
      })

      const [err, res] = await axios.get(`/api/parties/${context.party.id}/invitations/search`, {
        params: {
          search: state.input
        }
      })

      if (err) {
        return dispatch({
          type: 'request:error'
        })
      }

      dispatch({
        type: 'request:success',
        payload: { data: res.data }
      })
    },
    500,
    [state.input]
  )

  function handleInput(evt: React.FormEvent<HTMLInputElement>) {
    dispatch({
      type: 'input',
      payload: { input: evt.currentTarget.value }
    })
  }

  const isMemberMap = useMemo(() => {
    return toSearchObject(context.party.members, 'id')
  }, [context.party.members])

  const invitationMap = useMemo(() => {
    return toSearchIndexObject(context.party.invitations, 'recipient.id')
  }, [context.party.invitations])

  async function handleInvite(id: number) {
    if (state.isSendingInvitation[id]) {
      return
    }

    dispatch({
      type: 'invitation.send:init',
      payload: { id }
    })

    const [err, res] = await axios.post(`/api/parties/${context.party.id}/invitations/send`, {
      recipient_id: id
    })

    if (err) {
      return dispatch({
        type: 'invitation.send:error',
        payload: { id }
      })
    }

    dispatch({
      type: 'invitation.send:success',
      payload: { id }
    })

    context.onInvite(res.data)
  }

  async function handleCancel(invitation: AppPartyInvitation) {
    if (state.isCancellingInvitation[invitation.recipient.id]) {
      return
    }

    dispatch({
      type: 'invitation.cancel:init',
      payload: { id: invitation.recipient.id }
    })

    const [err, res] = await axios.post(`/api/invitations/${invitation.id}/cancel`)

    if (err) {
      return dispatch({
        type: 'invitation.cancel:error',
        payload: { id: invitation.recipient.id }
      })
    }

    dispatch({
      type: 'invitation.cancel:success',
      payload: { id: invitation.recipient.id }
    })

    context.onCancel(invitation)
  }

  return (
    <React.Fragment>
      <div className="invite-searchbar">
        <input
          type="text"
          className="ui-input"
          placeholder="Search for a friend to invite..."
          value={state.input}
          onChange={handleInput}
        />
      </div>

      {state.isLoading && 'Loading...'}

      {!state.input &&
        context.party.invitations.map(invitation => (
          <UserItem
            key={invitation.id}
            user={invitation.recipient}
            invitation={invitation}
            isMember={isMemberMap[invitation.recipient.id]}
            isCancellingInvitation={state.isCancellingInvitation[invitation.recipient.id]}
            onInvite={handleInvite}
            onCancel={handleCancel}
          />
        ))}

      {Boolean(state.input) &&
        state.data.map(user => (
          <UserItem
            key={user.id}
            user={user}
            invitation={context.party.invitations[invitationMap[user.id]]}
            isMember={isMemberMap[user.id]}
            isCancellingInvitation={state.isCancellingInvitation[user.id]}
            isSendingInvitation={state.isSendingInvitation[user.id]}
            onInvite={handleInvite}
            onCancel={handleCancel}
          />
        ))}
    </React.Fragment>
  )
}

interface UserItemProps {
  user: AppUser
  invitation?: AppPartyInvitation
  isMember: boolean
  isCancellingInvitation: boolean
  isSendingInvitation?: boolean
  onInvite: (id: number) => void
  onCancel: (invitation: AppPartyInvitation) => void
}

function UserItem(props: UserItemProps) {
  function handleInvite() {
    props.onInvite(props.user.id)
  }

  function handleCancel() {
    props.onCancel(props.invitation)
  }

  return (
    <div className="user-item">
      <div className="avatar">
        <UiAvatar img={props.user.avatar} size="m" />
      </div>

      <div className="details">
        <h4 className="name">{props.user.name}</h4>
        <h6 className="meta">{props.isMember && 'Already a member'}</h6>
        {/* <h6 className="meta">Expires in 10s</h6> */}
      </div>

      <div className="action">
        {props.invitation != null && (
          <UiButton onClick={handleCancel}>{props.isCancellingInvitation ? 'Cancelling' : 'Cancel'}</UiButton>
        )}

        {!props.isMember && props.invitation == null && (
          <UiButton variant="primary" onClick={handleInvite} disabled={props.isSendingInvitation}>
            {props.isSendingInvitation ? 'Inviting' : 'Invite'}
          </UiButton>
        )}
      </div>
    </div>
  )
}

export default AppWatchInvite
