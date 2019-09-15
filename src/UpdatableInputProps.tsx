import { observer } from "mobx-react-lite"
import React, { useMemo, useCallback } from 'react'
import fieldProps, { IUpdatable, OnValueChangeType } from "./field-props"
import FormErrorHandler from "./form-error-handler"

interface UpdatableInputPropsProps {
    children: React.ReactElement
    updatable: IUpdatable
    onValueChange?: OnValueChangeType
    errorHandler?: FormErrorHandler<unknown>
    isCheckbox?: boolean
}
export const UpdatableInputProps = observer((props: UpdatableInputPropsProps) => {
    const isCheckbox = (props.isCheckbox === undefined ? typeof props.updatable.value == 'boolean' : props.isCheckbox)
    
    const newFieldProps = fieldProps(props.updatable, props.onValueChange)
    
    const onChange = useCallback(newFieldProps.onChange, [props.updatable])
    const value = useMemo(() => newFieldProps.value, [newFieldProps.value])

    const errorProps = !!props.errorHandler && props.errorHandler.getFieldError(props.updatable)
    const newProps = isCheckbox ? { onChange, checked: value, ...errorProps } : { onChange, value, ...errorProps }

    const newElement = React.cloneElement(props.children, newProps)

    return newElement
})