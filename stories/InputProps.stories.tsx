import React from 'react';
import { InputProps } from '../src/InputProps'
import { useLocalStore, useObserver } from 'mobx-react';
import { observable, computed } from 'mobx';
import { FormErrorHandler } from '../src/form-error-handler';

export const InputPropsStory = () => {
  // this store is local just for the sake of the example. Ideally it would be in a separate file
  const store = useLocalStore(() => ({
    errorHandler: new FormErrorHandler<UserModel>(),
    user: new UserModel(),
    validate: () => {
      store.errorHandler.resetFieldError('firstName')
      if (!store.user.firstName) {
        store.errorHandler.error('firstName', "First name is mandatory")
      }
      store.errorHandler.resetFieldError('middleName')
      if (store.user.middleName.length !== 3) {
        store.errorHandler.error('middleName', "Middle name weirdly has to have exactly three characters")
      }
      store.errorHandler.resetFieldError('lastName')
      if (!store.user.lastName) {
        store.errorHandler.error('lastName', "Last name is mandatory")
      }
    }
  }))
  // check InputWithErrorField implementation out on InputProps.stories.tsx 
  return useObserver(() => <>
    <InputProps stateObject={store.user} propertyName='firstName' errorHandler={store.errorHandler}>
      <InputWithErrorField placeholder='First Name' />
    </InputProps>
    <br />
    <InputProps stateObject={store.user} propertyName='middleName' errorHandler={store.errorHandler}>
      <InputWithErrorField placeholder='Middle Name' />
    </InputProps>
    <br />
    <InputProps stateObject={store.user} propertyName='lastName' errorHandler={store.errorHandler}>
      <InputWithErrorField placeholder='Last Name' />
    </InputProps>
    <br />
    <button onClick={store.validate}>Validate</button>
    <br />
    <h3>{store.user.fullName}</h3>
  </>)
};

class UserModel {
  @observable firstName = ""
  @observable middleName = ""
  @observable lastName = ""
  @computed get fullName() {
    return `${this.firstName} ${this.middleName} ${this.lastName}`
  }
}

interface InputWithErrorFieldProps extends React.HTMLProps<HTMLInputElement> {
  helperText?: string // this prop is necessary for FormErrorHandler to work - works with material-ui out of the box
  error?: boolean // this prop is necessary for FormErrorHandler to work - works with material-ui out of the box
}
const InputWithErrorField = (props: InputWithErrorFieldProps) => {

  const { helperText, error, ...inputProps } = props
  const style = error ? { backgroundColor: 'red' } : {}

  return (
    <>
      <input {...inputProps} style={style} />
      {!!helperText && <h6>Error: {helperText}</h6>}
    </>
  )
}

export default {
  title: 'input-props',
  component: InputProps,
};
