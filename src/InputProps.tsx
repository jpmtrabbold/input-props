import { useObserver } from "mobx-react-lite"
import React, { useCallback } from 'react'
import { OnValueChangeType, fieldValueProps, InputPropsVariant, InputPropsConfig } from "./field-props"
import FormErrorHandler from "./form-error-handler"

/**
 * InputProps parameters
 */
interface InputPropsProps<T extends Object, P extends Extract<keyof T, string>> {
    /**
     * the component that you want InputProps to control. InputProps will add the `value`
     * and `onChange` props to the component to automate the state update to 
     * stateObject[propertyName]
     */
    children: React.ReactElement
    /**
     * object that holds the property that will be bound to this component. That property
     * has to be a mobx observable
     */
    stateObject: T
    /**
     * name of the property inside the stateObject that will be bound to this component. 
     * That property has to be a mobx observable
     */
    propertyName: P
    /**
     * in case you want to be notified about when a change will take place. Your callback
     * can return a promise that, if fulfilled with a return of false, will preven the 
     * update to happen.
     */
    onValueChange?: OnValueChangeType
    /**
     * in case you are using a FormErrorHandler to handle the form errors
     */
    errorHandler?: FormErrorHandler<T>
    /**
     * if the children is a checkbox
     */
    isCheckbox?: boolean
    /**
     * some built-in variants
     */
    variant?: InputPropsVariant
    /**
     * some built-in configurations
     */
    config?: InputPropsConfig
}

/**
 * A React component that provides a two-way data-binding feel to your forms controlled by a mobx state.
 * @param props InputProps props
 * @example
 * 
 * const store = useLocalStore(() => ({
 *    myFieldValue: ''
 * }))
 * 
 * <InputProps stateObject={store} propertyName='myFieldValue'>
 *    <input/>
 * </InputProps>
 * 
 */
export function InputProps<T extends Object, P extends Extract<keyof T, string>>(props: InputPropsProps<T, P>) {
    const [stateObject, propertyName, onValueChange, isCheckboxProps, errorHandler, value, variant, config] =
        useObserver(() => [props.stateObject, props.propertyName, props.onValueChange, props.isCheckbox, props.errorHandler, props.stateObject[props.propertyName], props.variant, props.config])
    const isCheckbox = (isCheckboxProps === undefined ? typeof stateObject[propertyName] == 'boolean' : isCheckboxProps)

    const newFieldProps = fieldValueProps(stateObject, propertyName, onValueChange, variant, config)
    const onChange = useCallback(newFieldProps.onChange, [stateObject])

    const errorProps = !!errorHandler && errorHandler.getFieldError(propertyName)
    const newProps = isCheckbox ? { onChange, checked: value, ...errorProps } : { onChange, value, ...errorProps }

    return useObserver(() => React.cloneElement(props.children, newProps))
}