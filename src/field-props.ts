import { isObservableProp } from "mobx"

export interface IUpdatable { value?: any, updated: boolean }
export type OnValueChangeType = (newValue: any) => Promise<boolean | undefined | void>
export type InputPropsVariant = 'all' | 'onlyNumbers'

export type InputPropsConfig = {
    /**
     * if variant is onlyNumbers, this will restrict the number of decimal places (down to 0)
     */
    maxDecimalPlaces?: number
    /**
     * if variant is onlyNumbers, this will restrict the number of integer places
     */
    maxIntegerLength?: number
}

export  function checkboxProps(updatableObject: IUpdatable, onValueChange?: OnValueChangeType, variant: InputPropsVariant = 'all', config: InputPropsConfig = {}): { onChange: any, checked: boolean } {
    const props = fieldProps(updatableObject, onValueChange, variant, config)
    return { onChange: props.onChange, checked: props.value }
}

export default function fieldProps(updatableObject: IUpdatable, onValueChange?: OnValueChangeType, variant: InputPropsVariant = 'all', config: InputPropsConfig = {}): { onChange: any, value: any } {

    const setValue = (value: any) => {
        updatableObject.value = value

        if (!updatableObject.updated)
            updatableObject.updated = true
    }

    if (!isObservableProp(updatableObject, 'value')) {
        throw new Error(`Property 'value' on the updatable object is not a mobx observable.`)
    }

    const onChange = async (event: any) => {
        if (event === undefined || event == null) {
            return
        }
        const value = (!event.target ? event : event.target.type === 'checkbox' ? event.target.checked : event.target.value)
        if (updatableObject.value !== value) {
            if (!checkValue(value, variant, config)) {
                return
            }
            if (onValueChange) {
                const valueChangeRet = await onValueChange(value)
                if (typeof valueChangeRet !== "boolean" || valueChangeRet) {
                    setValue(value)
                }
            } else {
                setValue(value)
            }
        }
    }
    return { onChange, value: (updatableObject.value === undefined ? null : updatableObject.value) }
}

function countDecimals(number: number) {
    if(Math.floor(number.valueOf()) === number.valueOf()) return 0;
    const split = number.toString().split(".")
    return (split.length > 1 && split[1].length) || 0; 
}

function countIntegerLength(number: number) {
    const split = number.toString().split(".")
    return (split[0].length) || 0; 
}

function checkValue(value: any, variant: InputPropsVariant, config: InputPropsConfig = {}) {
    switch (variant) {
        case 'onlyNumbers':
            if (isNaN(value)) {
                return false
            }
            if (config.maxDecimalPlaces !== undefined && countDecimals(value) > config.maxDecimalPlaces) {
                return false
            }
            if (config.maxIntegerLength !== undefined && countIntegerLength(value) > config.maxIntegerLength) {
                return false
            }
            break;
    }
    return true
}

export  function checkboxValueProps<T extends Object, P extends Extract<keyof T, string>>(parentObject: T, propertyName: P, onValueChange?: OnValueChangeType, variant: InputPropsVariant = 'all', config: InputPropsConfig = {}): { onChange: any, checked: boolean } {
    const props = fieldValueProps(parentObject, propertyName, onValueChange, variant, config)
    return { onChange: props.onChange, checked: props.value }
}

/**
 * similar to fieldProps, but will work with any property that is not an updatable
 * @param parentObject object that holds the property
 * @param propertyName name of the property that will be updated
 * @param onValueChange optional - callback whenever the field changes. This callback has to return true if it accepts the new value, or false if not
 */
export function fieldValueProps<T extends Object, P extends Extract<keyof T, string>>(parentObject: T, propertyName: P, onValueChange?: OnValueChangeType, variant: InputPropsVariant = 'all', config: InputPropsConfig = {}): { onChange: any, value: any } {

    const setValue = (value: any) => {
        parentObject[propertyName] = value
    }

    if (!isObservableProp(parentObject, propertyName)) {
        throw new Error(`Property ${propertyName} is not an mobx observable.`)
    }

    const onChange = async (event: any) => {
        if (event === undefined || event == null) {
            return
        }
        const value = (!event.target ? event : event.target.type === 'checkbox' ? event.target.checked : event.target.value)
        if (parentObject[propertyName] !== value) {
            if (!checkValue(value, variant, config)) {
                return
            }
            if (onValueChange) {
                const valueChangeRet = await onValueChange(value)
                if (typeof valueChangeRet !== "boolean" || valueChangeRet) {
                    setValue(value)
                }
            } else {
                setValue(value)
            }
        }
    }
    return { onChange, value: (parentObject[propertyName] === undefined ? null : parentObject[propertyName]) }
}