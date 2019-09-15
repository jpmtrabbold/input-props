import { useObserver } from "mobx-react-lite"
import React, {  useCallback } from 'react'
import { OnValueChangeType, fieldValueProps } from "./field-props"
import FormErrorHandler from "./form-error-handler"

interface InputPropsProps<T extends Object, P extends Extract<keyof T, string>> {
    children: React.ReactElement
    stateObject: T
    propertyName: P
    onValueChange?: OnValueChangeType
    errorHandler?: FormErrorHandler<T>
    isCheckbox?: boolean
}

export const InputProps = <T extends Object, P extends Extract<keyof T, string>>(props: InputPropsProps<T, P>) => {
    const [stateObject, propertyName, onValueChange, isCheckboxProps, errorHandler, value] = 
        useObserver(() => [props.stateObject, props.propertyName, props.onValueChange, props.isCheckbox, props.errorHandler, props.stateObject[props.propertyName]])
    const isCheckbox = (isCheckboxProps === undefined ? typeof stateObject[propertyName] == 'boolean' : isCheckboxProps)

    const newFieldProps = fieldValueProps(stateObject, propertyName, onValueChange)
    const onChange = useCallback(newFieldProps.onChange, [stateObject])

    const errorProps = !!errorHandler && errorHandler.getFieldError(propertyName)
    const newProps = isCheckbox ? { onChange, checked: value, ...errorProps } : { onChange, value, ...errorProps }

    return useObserver(() => React.cloneElement(props.children, newProps))
}