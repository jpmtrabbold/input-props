import { useCallback, useMemo } from 'react'
import { isObservableProp } from 'mobx'

/**
 * instantiate this hook in your functional component's body to use its return to bind state to html elements.
 * Ex:
 * @example
 * const MyComponent = () => {
 *      
 *    // ideally this goes into a store
 *    const data = useObservable({
 *       property1: 'field value here',
 *       property2: 'another field value',
 *       boolProp: true
 *    })
 * 
 *    const fieldProps = useFieldProps(data)
 * 
 *    return (
 *       <MyForm>
 *          <input {...fieldProps('property1')}/>
 *          <TextField label='Material-UI field' {...fieldProps('property2') />  // works with most UI frameworks - this is a Material-UI example
 *          <input type='checkbox' {...fieldProps('boolProp')} />
 *       </MyForm>
 *    )
 * }
 * @param parentObject pass on the parent object that will hold the mobx observable properties that will be bound to html elements
 */
export default function useFieldProps<T extends Object>(parentObject: T) {
    /**
     * 
     * @param propertyName this is the property that will be bound to the html element (like an input). 
     * Whenever the value changes, this property will be updated
     * @param onValueChange optionally, you can pass here a callback that will be called immediately before updating the property.
     * If it returns a boolean promise, the boolean return will define whether the property will be updated or not. Use the 
     * boolean promise as false to interrupt/cancel the property being set.
     */
    function fieldProps<P extends Extract<keyof T, string>>(
        propertyName: P,
        onValueChange?: (newValue: any) => Promise<boolean>) {

        return useMemo(() => {

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
        }, [propertyName, onValueChange])
    }

    return useCallback(fieldProps, [parentObject])
}