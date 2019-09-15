import { useCallback, useMemo } from 'react'
import { isObservableProp } from 'mobx'

type Updatable = {
    value?: any,
    updated: boolean
}

/**
 * Instantiate this hook in your functional component's body to use its return to bind updatable state to html elements.
 * This handles updatable data (objects with 'value' and 'updated'). The 'updated' will be set to true if that value 
 * was updated.
 * Ex:
 * @example
 * const MyComponent = () => {
 *    
 *    // ideally this goes into a store
 *    const data = useObservable({
 *       property1: {
 *          value: 'field value here',
 *          updated: false
 *       },
 *       property2: {
 *          value: 'another field value here',
 *          updated: false
 *       },
 *       boolProp: {
 *          value: true,
 *          updated: false
 *       },
 *    })
 * 
 *    const updFieldProps = useUpdatableFieldProps()
 * 
 *    return (
 *       <MyForm>
 *          <input {...updFieldProps(data.property1)}/>
 *          <TextField label='Material-UI field' {...updFieldProps(data.property2) /> // works with most UI frameworks - this is a Material-UI example
 *          <input type='checkbox' {...updFieldProps(data.boolProp)} />
 *       </MyForm>
 *    )
 * }
 * @param parentObject pass on the parent object that will hold the mobx observable properties that will be bound to html elements
 */
export default function useUpdatableFieldProps() {
    /**
     * 
     * @param updatableObject this is an object with 'value' and 'updated' properties. The 'updated' property will be set to 
     * true whenever the value is updated.
     * @param onValueChange optionally, you can pass here a callback that will be called immediately before updating the property.
     * If it returns a boolean promise, the boolean return will define whether the property will be updated or not. Use the 
     * boolean promise as false to interrupt/cancel the property being set.
     */
    function fieldProps(
        updatableObject: Updatable,
        onValueChange?: (newValue: any) => Promise<boolean>) {

        return useMemo(() => {

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
        }, [updatableObject, onValueChange])
    }

    return useCallback(fieldProps, [])
}