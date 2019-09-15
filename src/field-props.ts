import { isObservableProp } from "mobx"

export interface IUpdatable { value?: any, updated: boolean }
export type OnValueChangeType = (newValue: any) => Promise<boolean>

export  function checkboxProps(updatableObject: IUpdatable, onValueChange?: OnValueChangeType): { onChange: any, checked: boolean } {
    const props = fieldProps(updatableObject, onValueChange)
    return { onChange: props.onChange, checked: props.value }
}

export default function fieldProps(updatableObject: IUpdatable, onValueChange?: OnValueChangeType): { onChange: any, value: any } {

    const setValue = (value: any) => {
        updatableObject.value = value

        if (!updatableObject.updated)
            updatableObject.updated = true
    }

    if (!isObservableProp(updatableObject, 'value')) {
        throw new Error(`Property 'value' on the updatable object is not a mobx observable.`)
    }

    const onChange = async (event: any) => {
        if (event === undefined) {
            return
        }
        const value = (!event.target ? event : event.target.type === 'checkbox' ? event.target.checked : event.target.value)
        if (updatableObject.value !== value) {
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
    return { onChange, value: updatableObject.value }
}

export  function checkboxValueProps<T extends Object, P extends Extract<keyof T, string>>(parentObject: T, propertyName: P, onValueChange?: (newValue: any) => Promise<boolean>): { onChange: any, checked: boolean } {
    const props = fieldValueProps(parentObject, propertyName, onValueChange)
    return { onChange: props.onChange, checked: props.value }
}

/**
 * similar to fieldProps, but will work with any property that is not an updatable
 * @param parentObject object that holds the property
 * @param propertyName name of the property that will be updated
 * @param onValueChange optional - callback whenever the field changes. This callback has to return true if it accepts the new value, or false if not
 */
export function fieldValueProps<T extends Object, P extends Extract<keyof T, string>>(parentObject: T, propertyName: P, onValueChange?: (newValue: any) => Promise<boolean>): { onChange: any, value: any } {

    const setValue = (value: any) => {
        parentObject[propertyName] = value
    }

    if (!isObservableProp(parentObject, propertyName)) {
        throw new Error(`Property ${propertyName} is not an mobx observable.`)
    }

    const onChange = async (event: any) => {
        if (event === undefined) {
            return
        }
        const value = (!event.target ? event : event.target.type === 'checkbox' ? event.target.checked : event.target.value)
        if (parentObject[propertyName] !== value) {
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
    return { onChange, value: parentObject[propertyName] }
}